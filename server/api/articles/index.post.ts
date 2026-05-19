import { db } from '../../db'
import { articles } from '../../db/schema'
import { createArticleSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createArticleSchema.parse)

  const article = {
    id: generateId(),
    ...body,
  }

  await db.insert(articles).values(article)
  setResponseStatus(event, 201)
  return article
})
