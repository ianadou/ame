import { sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '../db'
import { categories, parametres } from '../db/schema'
import { seedDemo } from '../utils/demoData'

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
    return
  }

  // Données d'exemple au tout premier lancement uniquement : base vierge
  // ET aucun paramètre utilisateur encore enregistré. Après un reset
  // (l'utilisateur a déjà son identité en base), on ne re-seede pas.
  try {
    const [{ n: nbCat }] = await db.select({ n: sql<number>`count(*)` }).from(categories)
    const [{ n: nbParam }] = await db.select({ n: sql<number>`count(*)` }).from(parametres)
    if (nbCat === 0 && nbParam === 0) {
      await seedDemo()
      console.log('migrate: données d’exemple insérées (premier lancement)')
    }
  } catch (e) {
    console.error('migrate: échec du seed de démonstration', e)
  }
})
