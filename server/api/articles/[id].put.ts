import { eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { articles } from '~/server/db/schema'
import { updateArticleSchema } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateArticleSchema.parse)

  const [existing] = await db.select().from(articles).where(eq(articles.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Article introuvable' })
  }

  await db
    .update(articles)
    .set({ ...body, updatedAt: sql`(datetime('now'))` })
    .where(eq(articles.id, id))

  return { ...existing, ...body }
})
