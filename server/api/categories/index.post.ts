import { db } from '~/server/db'
import { categories } from '~/server/db/schema'
import { createCategorieSchema } from '~/server/utils/validation'
import { generateId } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createCategorieSchema.parse)

  const categorie = {
    id: generateId(),
    ...body,
  }

  await db.insert(categories).values(categorie)
  setResponseStatus(event, 201)
  return categorie
})
