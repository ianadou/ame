import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { fournisseurs, commandes } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(fournisseurs).where(eq(fournisseurs.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable' })
  }

  const linkedCommandes = await db
    .select({ id: commandes.id })
    .from(commandes)
    .where(eq(commandes.fournisseurId, id))
    .limit(1)

  if (linkedCommandes.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Impossible de supprimer un fournisseur ayant des commandes',
    })
  }

  await db.delete(fournisseurs).where(eq(fournisseurs.id, id))

  return { success: true }
})
