import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { clients } from '../../db/schema'
import { updateClientSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateClientSchema.parse)

  const [existing] = await db.select().from(clients).where(eq(clients.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Client introuvable' })
  }

  await db.update(clients).set(body).where(eq(clients.id, id))

  return { ...existing, ...body }
})
