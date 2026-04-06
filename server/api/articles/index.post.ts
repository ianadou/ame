import { db } from '~/server/db'
import { articles } from '~/server/db/schema'
import { createArticleSchema } from '~/server/utils/validation'
import { generateId } from '~/server/utils/helpers'

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
