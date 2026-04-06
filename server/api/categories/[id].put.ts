import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { categories } from '~/server/db/schema'
import { updateCategorieSchema } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateCategorieSchema.parse)

  const [existing] = await db.select().from(categories).where(eq(categories.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Catégorie introuvable' })
  }

  await db.update(categories).set(body).where(eq(categories.id, id))

  return { ...existing, ...body }
})
