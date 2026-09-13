import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { resolve } from 'path'
import * as schema from './schema'

// Priorité au chemin fourni par le binaire Tauri (mode packagé) : base dans
// un dossier inscriptible par-utilisateur, indépendant du cwd du sidecar.
const packagedDbFile = process.env.AME_DB_FILE
const isFileDb =
  !process.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL.startsWith('file:')

// Chemin du fichier SQLite, ou null pour une base distante (Turso) : copies et
// restaurations ne valent que pour une base stockée sur cet ordinateur.
export const cheminBase = packagedDbFile ?? (isFileDb ? resolve(process.cwd(), 'dev.db') : null)

export const client = createClient({
  url: cheminBase ? `file:${cheminBase}` : process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
