import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '../db'

// Mode packagé (Tauri) uniquement : applique les migrations Drizzle au
// démarrage sur la base par-utilisateur. AME_MIGRATIONS_DIR est fourni par
// le binaire Tauri (ressource empaquetée). En dev, le schéma est géré par
// `drizzle-kit push` → on ne lance PAS le migrator (éviter les conflits).
export default defineNitroPlugin(async () => {
  const migrationsFolder = process.env.AME_MIGRATIONS_DIR
  if (!migrationsFolder) return

  try {
    await migrate(db, { migrationsFolder })
    console.log('migrate: schéma à jour')
  } catch (e) {
    console.error('migrate: échec des migrations', e)
  }
})
