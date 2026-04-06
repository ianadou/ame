import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { categories, articles } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(categories).where(eq(categories.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Catégorie introuvable' })
  }

  const linkedArticles = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.categorieId, id))
    .limit(1)

  if (linkedArticles.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de supprimer une catégorie liée à des articles',
    })
  }

  await db.delete(categories).where(eq(categories.id, id))

  return { success: true }
})
