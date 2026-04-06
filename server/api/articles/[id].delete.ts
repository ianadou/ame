import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { articles, mouvements } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(articles).where(eq(articles.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Article introuvable' })
  }

  const linkedMouvements = await db
    .select({ id: mouvements.id })
    .from(mouvements)
    .where(eq(mouvements.articleId, id))
    .limit(1)

  if (linkedMouvements.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de supprimer un article ayant des mouvements',
    })
  }

  await db.delete(articles).where(eq(articles.id, id))

  return { success: true }
})
