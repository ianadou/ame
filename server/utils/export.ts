import { eq, desc, asc } from 'drizzle-orm'
import ExcelJS from 'exceljs'
import { db } from '../db'
import { articles, categories, fournisseurs, clients, sorties, mouvements } from '../db/schema'

export type EntiteExport = 'articles' | 'categories' | 'fournisseurs' | 'clients' | 'mouvements'

export const ENTITES_EXPORT: EntiteExport[] = [
  'articles',
  'categories',
  'fournisseurs',
  'clients',
  'mouvements',
]

interface Options {
  categorie?: string
  type?: string
}

interface Jeu {
  entetes: string[]
  lignes: (string | number)[][]
}

function dateFr(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

async function jeuDonnees(entite: EntiteExport, opts: Options): Promise<Jeu> {
  if (entite === 'articles') {
    const rows = await db
      .select({
        reference: articles.reference,
        nom: articles.nom,
        categorie: categories.nom,
        unite: articles.unite,
        prixUnitaire: articles.prixUnitaire,
        stockActuel: articles.stockActuel,
        seuilAlerte: articles.seuilAlerte,
        emplacement: articles.emplacement,
        notes: articles.notes,
        categorieId: articles.categorieId,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categorieId, categories.id))
      .orderBy(asc(articles.nom))
    const filtre = opts.categorie ? rows.filter((r) => r.categorieId === opts.categorie) : rows
    return {
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
      lignes: filtre.map((r) => [
        r.reference,
        r.nom,
        r.categorie ?? '',
        r.unite,
        r.prixUnitaire ?? '',
        r.stockActuel,
        r.seuilAlerte,
        r.emplacement ?? '',
        r.notes ?? '',
      ]),
    }
  }

  if (entite === 'categories') {
    const rows = await db.select().from(categories).orderBy(asc(categories.nom))
    const nomParId = new Map(rows.map((r) => [r.id, r.nom]))
    return {
      entetes: ['nom', 'description', 'parent'],
      lignes: rows.map((r) => [
        r.nom,
        r.description ?? '',
        r.parentId ? (nomParId.get(r.parentId) ?? '') : '',
      ]),
    }
  }

  if (entite === 'fournisseurs') {
    const rows = await db.select().from(fournisseurs).orderBy(asc(fournisseurs.nom))
    return {
      entetes: ['nom', 'telephone', 'email', 'adresse', 'ville', 'boite postale', 'ncc', 'notes'],
      lignes: rows.map((r) => [
        r.nom,
        r.telephone ?? '',
        r.email ?? '',
        r.adresse ?? '',
        r.ville ?? '',
        r.boitePostale ?? '',
        r.ncc ?? '',
        r.notes ?? '',
      ]),
    }
  }

  if (entite === 'clients') {
    const rows = await db.select().from(clients).orderBy(asc(clients.nom))
    return {
      entetes: [
        'nom',
        'type',
        'telephone',
        'email',
        'adresse',
        'ville',
        'boite postale',
        'ncc',
        'notes',
      ],
      lignes: rows.map((r) => [
        r.nom,
        r.type,
        r.telephone ?? '',
        r.email ?? '',
        r.adresse ?? '',
        r.ville ?? '',
        r.boitePostale ?? '',
        r.ncc ?? '',
        r.notes ?? '',
      ]),
    }
  }

  // mouvements : rapport d'activité (entrées / sorties)
  const rows = await db
    .select({
      createdAt: mouvements.createdAt,
      type: mouvements.type,
      reference: articles.reference,
      article: articles.nom,
      quantite: mouvements.quantite,
      fournisseur: fournisseurs.nom,
      client: clients.nom,
      bonLivraison: mouvements.bonLivraison,
      motif: mouvements.motif,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .leftJoin(sorties, eq(mouvements.sortieId, sorties.id))
    .leftJoin(clients, eq(sorties.clientId, clients.id))
    .orderBy(desc(mouvements.createdAt))
  const filtre = opts.type ? rows.filter((r) => r.type === opts.type) : rows
  return {
    entetes: [
      'date',
      'type',
      'reference',
      'article',
      'quantite',
      'fournisseur',
      'client',
      'bonLivraison',
      'motif',
    ],
    lignes: filtre.map((r) => [
      dateFr(r.createdAt),
      r.type === 'entree' ? 'Entrée' : 'Sortie',
      r.reference ?? '',
      r.article ?? '',
      r.quantite,
      r.fournisseur ?? '',
      r.client ?? '',
      r.bonLivraison ?? '',
      r.motif ?? '',
    ]),
  }
}

function champCsv(v: string | number): string {
  const s = String(v)
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function versCsv(jeu: Jeu): string {
  const lignes = [jeu.entetes.join(';'), ...jeu.lignes.map((l) => l.map(champCsv).join(';'))]
  return '﻿' + lignes.join('\r\n')
}

async function versXlsx(jeu: Jeu, entite: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(entite)
  ws.addRow(jeu.entetes)
  ws.getRow(1).font = { bold: true }
  for (const l of jeu.lignes) ws.addRow(l)
  ws.columns.forEach((c) => {
    c.width = 18
  })
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

export async function exporter(
  entite: EntiteExport,
  format: 'csv' | 'xlsx',
  opts: Options,
): Promise<{ corps: string | Buffer; type: string; filename: string }> {
  const jeu = await jeuDonnees(entite, opts)
  const date = new Date().toISOString().slice(0, 10)
  if (format === 'xlsx') {
    return {
      corps: await versXlsx(jeu, entite),
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `export-${entite}-${date}.xlsx`,
    }
  }
  return {
    corps: versCsv(jeu),
    type: 'text/csv; charset=utf-8',
    filename: `export-${entite}-${date}.csv`,
  }
}
