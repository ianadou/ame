import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { reglements } from '../../db/schema'
import { recalculerPaiement } from '../../utils/reglements'

/**
 * Supprime un règlement mal saisi et recalcule le statut du bon. C'est la
 * seule correction possible : un montant encaissé ne se modifie pas en place,
 * on retire la ligne fautive et on en ressaisit une juste, pour que
 * l'historique reste lisible.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [reglement] = await db.select().from(reglements).where(eq(reglements.id, id))
  if (!reglement) {
    throw createError({ statusCode: 404, message: 'Règlement introuvable' })
  }

  const totaux = await db.transaction(async (tx) => {
    await tx.delete(reglements).where(eq(reglements.id, id))
    return recalculerPaiement(tx, reglement.sortieId)
  })

  return { success: true, ...totaux }
})
