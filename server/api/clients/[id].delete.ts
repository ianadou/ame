import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { clients, sorties } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(clients).where(eq(clients.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Client introuvable' })
  }

  const linkedSorties = await db
    .select({ id: sorties.id })
    .from(sorties)
    .where(eq(sorties.clientId, id))
    .limit(1)

  if (linkedSorties.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de supprimer un client ayant des bons de sortie',
    })
  }

  await db.delete(clients).where(eq(clients.id, id))

  return { success: true }
})
