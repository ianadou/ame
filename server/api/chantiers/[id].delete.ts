import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers, mouvements } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(chantiers).where(eq(chantiers.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Chantier introuvable' })
  }

  const linkedMouvements = await db
    .select({ id: mouvements.id })
    .from(mouvements)
    .where(eq(mouvements.chantierId, id))
    .limit(1)

  if (linkedMouvements.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de supprimer un chantier ayant des mouvements',
    })
  }

  await db.delete(chantiers).where(eq(chantiers.id, id))

  return { success: true }
})
