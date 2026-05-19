import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { commandes, lignesCommande } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(commandes).where(eq(commandes.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Commande introuvable' })
  }

  if (existing.statut !== 'brouillon') {
    throw createError({
      statusCode: 400,
      message: 'Seule une commande en brouillon peut être supprimée',
    })
  }

  await db.transaction(async (tx) => {
    await tx.delete(lignesCommande).where(eq(lignesCommande.commandeId, id))
    await tx.delete(commandes).where(eq(commandes.id, id))
  })

  return { success: true }
})
