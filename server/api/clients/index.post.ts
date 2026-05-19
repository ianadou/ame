import { db } from '../../db'
import { clients } from '../../db/schema'
import { createClientSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createClientSchema.parse)

  const client = {
    id: generateId(),
    ...body,
  }

  await db.insert(clients).values(client)
  setResponseStatus(event, 201)
  return client
})
