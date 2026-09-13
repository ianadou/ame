import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { cheminBase, client } from '../db'

export type MotifSauvegarde =
  | 'quotidienne'
  | 'manuelle'
  | 'avant-mise-a-jour'
  | 'avant-effacement'
  | 'avant-restauration'

export interface Sauvegarde {
  nom: string
  creeLe: string
  taille: number
  motif: MotifSauvegarde
}

// Les copies vivent à côté de la base, dans le dossier de données de l'app :
// elles survivent aux mises à jour comme la base elle-même.
export const dossierSauvegardes = cheminBase ? join(dirname(cheminBase), 'sauvegardes') : null

// Rotation par motif : dix copies quotidiennes ne chassent jamais la copie
// faite avant une mise à jour ou un effacement.
const CONSERVEES_PAR_MOTIF = 10
const UN_JOUR = 24 * 60 * 60 * 1000
const FORMAT_NOM = /^ame-(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})_([a-z-]+)\.db$/

function deuxChiffres(n: number): string {
  return String(n).padStart(2, '0')
}

// Heure locale de la machine : c'est celle que l'utilisateur lit sur son écran.
function nomSauvegarde(motif: MotifSauvegarde, date = new Date()): string {
  const jour = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(deuxChiffres).join('-')
  const heure = [date.getHours(), date.getMinutes(), date.getSeconds()].map(deuxChiffres).join('-')
  return `ame-${jour}_${heure}_${motif}.db`
}

function exigerDossier(): string {
  if (!dossierSauvegardes) {
    throw createError({
      statusCode: 501,
      message: "Sauvegarde indisponible : la base n'est pas stockée sur cet ordinateur.",
    })
  }
  return dossierSauvegardes
}

async function decrire(dossier: string, nom: string): Promise<Sauvegarde> {
  const [, jour, heures, minutes, secondes, motif] = nom.match(FORMAT_NOM)!
  const { size } = await stat(join(dossier, nom))
  return {
    nom,
    creeLe: `${jour}T${heures}:${minutes}:${secondes}`,
    taille: size,
    motif: motif as MotifSauvegarde,
  }
}

export async function listerSauvegardes(): Promise<Sauvegarde[]> {
  const dossier = dossierSauvegardes
  if (!dossier || !existsSync(dossier)) return []
  const noms = (await readdir(dossier)).filter((nom) => FORMAT_NOM.test(nom))
  const sauvegardes = await Promise.all(noms.map((nom) => decrire(dossier, nom)))
  return sauvegardes.sort((a, b) => b.creeLe.localeCompare(a.creeLe))
}

async function elaguer(dossier: string): Promise<void> {
  const parMotif = new Map<MotifSauvegarde, Sauvegarde[]>()
  for (const sauvegarde of await listerSauvegardes()) {
    parMotif.set(sauvegarde.motif, [...(parMotif.get(sauvegarde.motif) ?? []), sauvegarde])
  }
  for (const liste of parMotif.values()) {
    for (const ancienne of liste.slice(CONSERVEES_PAR_MOTIF)) {
      await rm(join(dossier, ancienne.nom), { force: true })
    }
  }
}

export async function creerSauvegarde(motif: MotifSauvegarde): Promise<Sauvegarde> {
  const dossier = exigerDossier()
  await mkdir(dossier, { recursive: true })
  const nom = nomSauvegarde(motif)
  if (existsSync(join(dossier, nom))) {
    throw createError({
      statusCode: 409,
      message: 'Une sauvegarde vient d’être faite à l’instant.',
    })
  }
  // VACUUM INTO écrit une copie cohérente sans arrêter l'app, là où copier le
  // fichier pourrait saisir une écriture à moitié faite.
  await client.execute({ sql: 'VACUUM INTO ?', args: [join(dossier, nom)] })
  await elaguer(dossier)
  return decrire(dossier, nom)
}

export async function sauvegardeQuotidienneSiBesoin(): Promise<Sauvegarde | null> {
  if (!dossierSauvegardes) return null
  const [derniere] = await listerSauvegardes()
  if (derniere && Date.now() - new Date(derniere.creeLe).getTime() < UN_JOUR) return null
  return creerSauvegarde('quotidienne')
}

async function derniereMigrationAppliquee(base: Client): Promise<number | null> {
  const table = await base.execute(
    "select 1 from sqlite_master where type = 'table' and name = '__drizzle_migrations'",
  )
  if (table.rows.length === 0) return null
  const resultat = await base.execute(
    'select max(created_at) as derniere from __drizzle_migrations',
  )
  return Number(resultat.rows[0]?.derniere ?? 0)
}

async function derniereMigrationConnue(dossierMigrations: string): Promise<number> {
  const journal = JSON.parse(
    await readFile(join(dossierMigrations, 'meta', '_journal.json'), 'utf8'),
  ) as { entries: { when: number }[] }
  return Math.max(...journal.entries.map((entree) => entree.when))
}

// Vrai quand la base existe déjà et que l'app apporte des migrations qu'elle
// n'a pas encore reçues. Une installation neuve n'a rien à protéger.
export async function migrationsEnAttente(dossierMigrations: string): Promise<boolean> {
  const appliquee = await derniereMigrationAppliquee(client)
  return appliquee !== null && appliquee < (await derniereMigrationConnue(dossierMigrations))
}

// La restauration travaille sur une copie de la sauvegarde, mise au schéma de
// l'app : la sauvegarde elle-même reste intacte, même si cette étape échoue.
async function preparerCopie(nom: string): Promise<string> {
  const dossier = exigerDossier()
  if (!FORMAT_NOM.test(nom) || !existsSync(join(dossier, nom))) {
    throw createError({ statusCode: 404, message: 'Sauvegarde introuvable' })
  }
  const copie = join(dossier, 'restauration-en-cours.tmp')
  await copyFile(join(dossier, nom), copie)

  const base = createClient({ url: `file:${copie}` })
  try {
    const dossierMigrations = process.env.AME_MIGRATIONS_DIR
    if (dossierMigrations) {
      const appliquee = await derniereMigrationAppliquee(base)
      if (appliquee !== null && appliquee > (await derniereMigrationConnue(dossierMigrations))) {
        throw createError({
          statusCode: 409,
          message:
            "Cette sauvegarde vient d'une version plus récente d'AME : mettez l'application à jour avant de la restaurer.",
        })
      }
      await migrate(drizzle(base), { migrationsFolder: dossierMigrations })
    }
  } catch (e) {
    base.close()
    await rm(copie, { force: true })
    throw e
  }
  base.close()
  return copie
}

// Tables métier des parents vers les enfants, d'après les clés étrangères :
// la connexion les applique, un parent ne se vide pas avant ses enfants.
async function tablesParDependance(): Promise<string[]> {
  const noms = (
    await client.execute(
      "select name from main.sqlite_master where type = 'table' and name not like 'sqlite_%' and name <> '__drizzle_migrations'",
    )
  ).rows.map((ligne) => String(ligne.name))
  const ordre: string[] = []
  const vues = new Set<string>()

  async function visiter(table: string) {
    if (vues.has(table)) return
    vues.add(table)
    const parents = (await client.execute(`PRAGMA main.foreign_key_list("${table}")`)).rows
    for (const parent of parents.map((ligne) => String(ligne.table))) {
      if (parent !== table && noms.includes(parent)) await visiter(parent)
    }
    ordre.push(table)
  }

  for (const table of noms) await visiter(table)
  return ordre
}

async function colonnes(schema: 'main' | 'source', table: string): Promise<string[]> {
  return (await client.execute(`PRAGMA ${schema}.table_info("${table}")`)).rows.map((ligne) =>
    String(ligne.name),
  )
}

async function instructionsDeRemplacement(): Promise<string[]> {
  const tables = await tablesParDependance()
  const suppressions = [...tables].reverse().map((table) => `DELETE FROM main."${table}"`)
  const insertions: string[] = []
  for (const table of tables) {
    const dansSource = new Set(await colonnes('source', table))
    const communes = (await colonnes('main', table))
      .filter((colonne) => dansSource.has(colonne))
      .map((colonne) => `"${colonne}"`)
      .join(', ')
    if (communes) {
      insertions.push(
        `INSERT INTO main."${table}" (${communes}) SELECT ${communes} FROM source."${table}"`,
      )
    }
  }
  return ['PRAGMA defer_foreign_keys = ON', ...suppressions, ...insertions]
}

/**
 * Remplace les données de la base par celles d'une sauvegarde, sans redémarrer
 * l'app. Une copie de l'état actuel est faite d'abord : une restauration se
 * défait par une autre restauration. L'historique des migrations de la base
 * n'est pas touché, la copie ayant été mise au même schéma.
 *
 * Tout passe par la connexion du client : ATTACH est refusé dans une
 * transaction, et `client.transaction()` confierait l'attache à une connexion
 * qu'il ne referme jamais. Le batch, lui, s'exécute en une seule transaction
 * sur cette même connexion, et le DETACH libère ensuite le fichier.
 */
export async function restaurerSauvegarde(nom: string): Promise<void> {
  const copie = await preparerCopie(nom)
  try {
    await creerSauvegarde('avant-restauration')
    await client.execute({ sql: 'ATTACH DATABASE ? AS source', args: [copie] })
    try {
      await client.batch(await instructionsDeRemplacement(), 'write')
    } finally {
      await client.execute('DETACH DATABASE source')
    }
  } finally {
    await rm(copie, { force: true })
  }
}

// Ouvre le dossier dans l'explorateur de fichiers de la machine qui fait
// tourner le serveur : en mode installé, l'ordinateur de l'utilisateur.
export async function ouvrirDossierSauvegardes(): Promise<void> {
  const dossier = exigerDossier()
  await mkdir(dossier, { recursive: true })
  const explorateur =
    process.platform === 'win32' ? 'explorer' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  const processus = spawn(explorateur, [dossier], { detached: true, stdio: 'ignore' })
  processus.on('error', (e) => console.error('sauvegardes: ouverture du dossier impossible', e))
  processus.unref()
}
