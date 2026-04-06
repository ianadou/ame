import { db } from '../../db'
import { categories } from '../../db/schema'
import { createCategorieSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

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
