import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(chantiers).where(eq(chantiers.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Chantier introuvable' })
  }

  // Note : étape 2 ajoutera des FK depuis sorties/mouvements vers
  // chantiers ; à ce moment on bloquera la suppression si transactions
  // associées. Pour l'instant, la table est isolée → suppression libre.
  await db.delete(chantiers).where(eq(chantiers.id, id))

  return { success: true }
})
