import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { resolve } from 'path'
import * as schema from './schema'

// Priorité au chemin fourni par le binaire Tauri (mode packagé) : base dans
// un dossier inscriptible par-utilisateur, indépendant du cwd du sidecar.
const packagedDbFile = process.env.AME_DB_FILE
const isFileDb =
  !process.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL.startsWith('file:')
const dbUrl = packagedDbFile
  ? `file:${packagedDbFile}`
  : isFileDb
    ? `file:${resolve(process.cwd(), 'dev.db')}`
    : process.env.TURSO_DATABASE_URL!

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
