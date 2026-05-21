import { parse as parseCsv } from 'csv-parse/sync'
import ExcelJS from 'exceljs'
import { eq } from 'drizzle-orm'
import type { ZodTypeAny } from 'zod'
import { db } from '../db'
import { articles, categories, fournisseurs, clients } from '../db/schema'
import { generateId } from './helpers'
import {
  importArticleSchema,
  importCategorieSchema,
  importFournisseurSchema,
  importClientSchema,
} from './validation'

export type EntiteImport = 'articles' | 'categories' | 'fournisseurs' | 'clients'

export const ENTITES_IMPORT: EntiteImport[] = ['articles', 'categories', 'fournisseurs', 'clients']

export const MAX_TAILLE = 5 * 1024 * 1024
export const MAX_LIGNES = 5000

interface ColonneDef {
  champ: string
  alias: string[]
  obligatoire?: boolean
  numerique?: boolean
}

interface EntiteConfig {
  colonnes: ColonneDef[]
  schema: ZodTypeAny
  cleUpsert: string
  modele: { entetes: string[]; exemple: string[] }
  appliquer: (
    lignes: { ligne: number; data: Record<string, unknown> }[],
    dryRun: boolean,
  ) => Promise<ResultatApply>
}

interface ResultatApply {
  crees: number
  maj: number
  erreurs: ErreurLigne[]
  actions: { ligne: number; action: 'create' | 'update'; donnees: Record<string, unknown> }[]
}

export interface ErreurLigne {
  ligne: number
  champ?: string
  message: string
}

export interface RapportImport {
  entite: EntiteImport
  total: number
  valides: number
  crees?: number
  maj?: number
  avertissements: string[]
  erreurs: ErreurLigne[]
  apercu?: { ligne: number; action: 'create' | 'update'; donnees: Record<string, unknown> }[]
}

function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normaliserNombre(v: unknown): unknown {
  if (typeof v !== 'string') return v
  const s = v.replace(/[\s\u00a0\u202f]/g, '')
  if (s.includes(',') && !s.includes('.')) return s.replace(',', '.')
  return s
}

function decoder(buffer: Buffer): string {
  const utf8 = buffer.toString('utf8')
  if (utf8.includes('�')) return buffer.toString('latin1')
  return utf8
}

/** Lit le fichier en lignes brutes { entete -> valeur } + entêtes d'origine. */
async function lireFichier(
  buffer: Buffer,
  nom: string,
): Promise<{ entetes: string[]; lignes: Record<string, string>[] }> {
  const ext = nom.toLowerCase().split('.').pop()

  if (ext === 'csv') {
    const texte = decoder(buffer).replace(/^\uFEFF/, '')
    const premiereLigne = texte.slice(0, texte.search(/\r?\n/) + 1 || texte.length)
    // Délimiteur unique détecté sur l'en-tête : « ; » (Excel FR) sinon « , »
    const delimiter = premiereLigne.includes(';') ? ';' : ','
    const records = parseCsv(texte, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      delimiter,
      relax_column_count: true,
    }) as Record<string, string>[]
    const entetes = records.length > 0 ? Object.keys(records[0]) : []
    return { entetes, lignes: records }
  }

  if (ext === 'xlsx') {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)
    const ws = wb.worksheets[0]
    if (!ws) return { entetes: [], lignes: [] }
    const entetes: string[] = []
    ws.getRow(1).eachCell((cell, col) => {
      entetes[col - 1] = String(cell.value ?? '').trim()
    })
    const lignes: Record<string, string>[] = []
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r)
      const obj: Record<string, string> = {}
      let vide = true
      entetes.forEach((h, i) => {
        if (!h) return
        const val = row.getCell(i + 1).value
        let str = ''
        if (val instanceof Date) str = val.toISOString().slice(0, 10)
        else if (val && typeof val === 'object' && 'text' in val)
          str = String((val as { text: unknown }).text ?? '')
        else str = val === null || val === undefined ? '' : String(val)
        obj[h] = str.trim()
        if (obj[h] !== '') vide = false
      })
      if (!vide) lignes.push(obj)
    }
    return { entetes, lignes }
  }

  throw createError({ statusCode: 400, message: 'Format non supporté (utiliser .csv ou .xlsx)' })
}

async function upsertParNom<T extends typeof fournisseurs | typeof clients | typeof categories>(
  table: T,
  lignes: { ligne: number; data: Record<string, unknown> }[],
  dryRun: boolean,
  extra?: (data: Record<string, unknown>, ligne: number) => Promise<ErreurLigne | null>,
) {
  let crees = 0
  let maj = 0
  const erreurs: ErreurLigne[] = []
  const actions: ResultatApply['actions'] = []
  const aInserer: Record<string, unknown>[] = []
  const aMettreAJour: { id: string; data: Record<string, unknown> }[] = []

  for (const { ligne, data } of lignes) {
    if (extra) {
      const err = await extra(data, ligne)
      if (err) {
        erreurs.push(err)
        continue
      }
    }
    const nom = data.nom as string
    const existants = await db.select({ id: table.id }).from(table).where(eq(table.nom, nom))
    if (existants.length > 1) {
      erreurs.push({ ligne, champ: 'nom', message: `upsert ambigu : « ${nom} » existe en double` })
      continue
    }
    if (existants.length === 1) {
      aMettreAJour.push({ id: existants[0].id, data })
      actions.push({ ligne, action: 'update', donnees: data })
      maj++
    } else {
      aInserer.push({ id: generateId(), ...data })
      actions.push({ ligne, action: 'create', donnees: data })
      crees++
    }
  }

  if (!dryRun && (aInserer.length > 0 || aMettreAJour.length > 0)) {
    await db.transaction(async (tx) => {
      if (aInserer.length > 0) await tx.insert(table).values(aInserer)
      for (const u of aMettreAJour) {
        await tx.update(table).set(u.data).where(eq(table.id, u.id))
      }
    })
  }

  return { crees, maj, erreurs, actions }
}

async function resoudreCategorie(
  nom: string,
  cache: Map<string, string>,
  aCreer: { id: string; nom: string }[],
): Promise<string> {
  const cle = nom.toLowerCase()
  if (cache.has(cle)) return cache.get(cle)!
  const [existante] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.nom, nom))
  if (existante) {
    cache.set(cle, existante.id)
    return existante.id
  }
  const id = generateId()
  aCreer.push({ id, nom })
  cache.set(cle, id)
  return id
}

const CONFIGS: Record<EntiteImport, EntiteConfig> = {
  articles: {
    cleUpsert: 'reference',
    schema: importArticleSchema,
    colonnes: [
      { champ: 'reference', alias: ['reference', 'ref', 'référence'], obligatoire: true },
      { champ: 'nom', alias: ['nom', 'designation', 'libelle', 'libellé'], obligatoire: true },
      { champ: 'categorie', alias: ['categorie', 'catégorie', 'famille'] },
      { champ: 'unite', alias: ['unite', 'unité', 'u'] },
      {
        champ: 'prixUnitaire',
        alias: ['prixunitaire', 'prix', 'prix unitaire', 'pu'],
        numerique: true,
      },
      {
        champ: 'stockActuel',
        alias: ['stockactuel', 'stock', 'quantite', 'quantité'],
        numerique: true,
      },
      { champ: 'seuilAlerte', alias: ['seuilalerte', 'seuil', 'seuil alerte'], numerique: true },
      { champ: 'emplacement', alias: ['emplacement', 'localisation'] },
      { champ: 'notes', alias: ['notes', 'remarque', 'remarques'] },
    ],
    modele: {
      entetes: [
        'reference',
        'nom',
        'categorie',
        'unite',
        'prixUnitaire',
        'stockActuel',
        'seuilAlerte',
        'emplacement',
        'notes',
      ],
      exemple: ['PLB-001', 'Tuyau PVC 32mm', 'Plomberie', 'pièce', '1500', '120', '10', 'A3', ''],
    },
    async appliquer(lignes, dryRun) {
      const cache = new Map<string, string>()
      const catsACreer: { id: string; nom: string }[] = []
      const erreurs: ErreurLigne[] = []
      const actions: ResultatApply['actions'] = []
      const aInserer: Record<string, unknown>[] = []
      const aMettreAJour: { id: string; data: Record<string, unknown> }[] = []
      let crees = 0
      let maj = 0

      for (const { ligne, data } of lignes) {
        const row = { ...data }
        const cat = row.categorie as string | undefined
        delete row.categorie
        if (cat) row.categorieId = await resoudreCategorie(cat, cache, catsACreer)

        const [existant] = await db
          .select({ id: articles.id })
          .from(articles)
          .where(eq(articles.reference, row.reference as string))
        if (existant) {
          aMettreAJour.push({ id: existant.id, data: row })
          actions.push({ ligne, action: 'update', donnees: row })
          maj++
        } else {
          aInserer.push({ id: generateId(), ...row })
          actions.push({ ligne, action: 'create', donnees: row })
          crees++
        }
      }

      if (!dryRun) {
        await db.transaction(async (tx) => {
          if (catsACreer.length > 0) await tx.insert(categories).values(catsACreer)
          if (aInserer.length > 0) await tx.insert(articles).values(aInserer)
          for (const u of aMettreAJour) {
            await tx.update(articles).set(u.data).where(eq(articles.id, u.id))
          }
        })
      }
      return { crees, maj, erreurs, actions }
    },
  },

  categories: {
    cleUpsert: 'nom',
    schema: importCategorieSchema,
    colonnes: [
      { champ: 'nom', alias: ['nom', 'categorie', 'catégorie'], obligatoire: true },
      { champ: 'description', alias: ['description', 'desc'] },
      { champ: 'parent', alias: ['parent', 'categorie parente', 'parente'] },
    ],
    modele: {
      entetes: ['nom', 'description', 'parent'],
      exemple: ['Plomberie', 'Tuyaux, raccords, robinetterie', ''],
    },
    async appliquer(lignes, dryRun) {
      const erreurs: ErreurLigne[] = []
      const actions: ResultatApply['actions'] = []
      const aInserer: Record<string, unknown>[] = []
      const aMettreAJour: { id: string; data: Record<string, unknown> }[] = []
      let crees = 0
      let maj = 0

      // Passe 1 : assigner un id par nom (existant ou nouveau) — gère les
      // références parent au sein du même fichier.
      const idParNom = new Map<string, string>()
      const resolus: {
        ligne: number
        nom: string
        data: Record<string, unknown>
        existe: boolean
      }[] = []

      for (const { ligne, data } of lignes) {
        const nom = data.nom as string
        const cle = nom.toLowerCase()
        const existants = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.nom, nom))
        if (existants.length > 1) {
          erreurs.push({
            ligne,
            champ: 'nom',
            message: `upsert ambigu : « ${nom} » existe en double`,
          })
          continue
        }
        const id = existants.length === 1 ? existants[0].id : generateId()
        idParNom.set(cle, id)
        resolus.push({ ligne, nom, data: { id, ...data }, existe: existants.length === 1 })
      }

      // Passe 2 : résoudre parent (DB ou lot courant), puis répartir.
      for (const r of resolus) {
        const data = { ...r.data }
        const parent = data.parent as string | undefined
        delete data.parent
        if (parent) {
          let parentId = idParNom.get(parent.toLowerCase())
          if (!parentId) {
            const [p] = await db
              .select({ id: categories.id })
              .from(categories)
              .where(eq(categories.nom, parent))
            parentId = p?.id
          }
          if (!parentId) {
            erreurs.push({
              ligne: r.ligne,
              champ: 'parent',
              message: `catégorie parente introuvable : « ${parent} »`,
            })
            continue
          }
          data.parentId = parentId
        }
        if (r.existe) {
          const { id, ...maj2 } = data
          aMettreAJour.push({ id: id as string, data: maj2 })
          actions.push({ ligne: r.ligne, action: 'update', donnees: maj2 })
          maj++
        } else {
          aInserer.push(data)
          actions.push({ ligne: r.ligne, action: 'create', donnees: data })
          crees++
        }
      }

      if (!dryRun && (aInserer.length > 0 || aMettreAJour.length > 0)) {
        await db.transaction(async (tx) => {
          if (aInserer.length > 0) await tx.insert(categories).values(aInserer)
          for (const u of aMettreAJour) {
            await tx.update(categories).set(u.data).where(eq(categories.id, u.id))
          }
        })
      }

      return { crees, maj, erreurs, actions }
    },
  },

  fournisseurs: {
    cleUpsert: 'nom',
    schema: importFournisseurSchema,
    colonnes: [
      { champ: 'nom', alias: ['nom', 'fournisseur', 'raison sociale'], obligatoire: true },
      { champ: 'telephone', alias: ['telephone', 'téléphone', 'tel', 'tél'] },
      { champ: 'email', alias: ['email', 'mail', 'courriel'] },
      { champ: 'adresse', alias: ['adresse'] },
      { champ: 'notes', alias: ['notes', 'remarque', 'remarques'] },
    ],
    modele: {
      entetes: ['nom', 'telephone', 'email', 'adresse', 'notes'],
      exemple: [
        'Matériaux BTP CI',
        '07 07 07 07 07',
        'contact@fournisseur.ci',
        'Cocody Riviera 3, Abidjan',
        '',
      ],
    },
    appliquer(lignes, dryRun) {
      return upsertParNom(fournisseurs, lignes, dryRun)
    },
  },

  clients: {
    cleUpsert: 'nom',
    schema: importClientSchema,
    colonnes: [
      { champ: 'nom', alias: ['nom', 'client', 'raison sociale'], obligatoire: true },
      { champ: 'type', alias: ['type', 'categorie', 'catégorie'] },
      { champ: 'telephone', alias: ['telephone', 'téléphone', 'tel', 'tél'] },
      { champ: 'email', alias: ['email', 'mail', 'courriel'] },
      { champ: 'adresse', alias: ['adresse', 'lieu'] },
      { champ: 'ville', alias: ['ville', 'commune'] },
      { champ: 'notes', alias: ['notes', 'remarque', 'remarques'] },
    ],
    modele: {
      entetes: ['nom', 'type', 'telephone', 'email', 'adresse', 'ville', 'notes'],
      exemple: [
        'Entreprise Kouassi BTP',
        'entreprise',
        '07 07 07 07 07',
        'contact@client.ci',
        'Cocody Riviera 3',
        'Abidjan',
        '',
      ],
    },
    appliquer(lignes, dryRun) {
      return upsertParNom(clients, lignes, dryRun)
    },
  },
}

export function configModele(entite: EntiteImport) {
  return CONFIGS[entite].modele
}

export async function traiterImport(
  entite: EntiteImport,
  buffer: Buffer,
  nom: string,
  dryRun: boolean,
): Promise<RapportImport> {
  const config = CONFIGS[entite]
  const { entetes, lignes } = await lireFichier(buffer, nom)

  if (lignes.length === 0) {
    throw createError({ statusCode: 400, message: 'Fichier vide ou sans données' })
  }
  if (lignes.length > MAX_LIGNES) {
    throw createError({ statusCode: 400, message: `Trop de lignes (max ${MAX_LIGNES})` })
  }

  // Mapping entête d'origine -> champ canonique
  const mapping = new Map<string, string>()
  for (const entete of entetes) {
    const norm = normaliser(entete)
    const def = config.colonnes.find((c) => c.alias.some((a) => normaliser(a) === norm))
    if (def) mapping.set(entete, def.champ)
  }

  const champsPresents = new Set(mapping.values())
  const manquantes = config.colonnes
    .filter((c) => c.obligatoire && !champsPresents.has(c.champ))
    .map((c) => c.champ)
  if (manquantes.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Colonnes obligatoires manquantes : ${manquantes.join(', ')}. Attendu : ${config.colonnes.map((c) => c.champ).join(', ')}`,
    })
  }

  const avertissements: string[] = []
  for (const entete of entetes) {
    if (entete && !mapping.has(entete))
      avertissements.push(`Colonne inconnue ignorée : « ${entete} »`)
  }

  const numeriques = new Set(config.colonnes.filter((c) => c.numerique).map((c) => c.champ))
  const erreurs: ErreurLigne[] = []
  const valides: { ligne: number; data: Record<string, unknown> }[] = []

  lignes.forEach((brute, idx) => {
    const ligne = idx + 2 // en-tête = ligne 1
    const entree: Record<string, unknown> = {}
    for (const [entete, champ] of mapping) {
      let val: unknown = brute[entete] ?? ''
      if (numeriques.has(champ)) val = normaliserNombre(val)
      entree[champ] = val
    }
    const res = config.schema.safeParse(entree)
    if (res.success) {
      valides.push({ ligne, data: res.data as Record<string, unknown> })
    } else {
      for (const issue of res.error.issues) {
        erreurs.push({
          ligne,
          champ: String(issue.path[0] ?? ''),
          message: issue.message,
        })
      }
    }
  })

  const base: RapportImport = {
    entite,
    total: lignes.length,
    valides: valides.length,
    avertissements,
    erreurs,
  }

  const r = await config.appliquer(valides, dryRun)
  base.crees = r.crees
  base.maj = r.maj
  base.erreurs = [...erreurs, ...r.erreurs].sort((a, b) => a.ligne - b.ligne)
  base.valides = r.crees + r.maj

  if (dryRun) {
    base.apercu = r.actions.slice(0, 100)
  }
  return base
}
