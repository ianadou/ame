import { eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { commandes, lignesCommande, articles, mouvements } from '../../../db/schema'
import { receptionSchema } from '../../../utils/validation'
import { generateId } from '../../../utils/helpers'

/**
 * Enregistre une réception (totale ou partielle) d'une commande : pour
 * chaque ligne reçue → +stock, +quantiteRecue, mouvement d'entrée. Le
 * statut de la commande passe à « partielle » ou « recue » selon le cumul.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, receptionSchema.parse)

  const [commande] = await db.select().from(commandes).where(eq(commandes.id, id))
  if (!commande) {
    throw createError({ statusCode: 404, message: 'Commande introuvable' })
  }
  if (commande.statut === 'annulee') {
    throw createError({ statusCode: 400, message: 'Commande annulée : réception impossible' })
  }

  const lignes = await db.select().from(lignesCommande).where(eq(lignesCommande.commandeId, id))
  const lignesParId = new Map(lignes.map((l) => [l.id, l]))

  // Validation préalable (échec atomique avant toute écriture).
  for (const recu of body.lignes) {
    const ligne = lignesParId.get(recu.ligneId)
    if (!ligne) {
      throw createError({ statusCode: 400, message: 'Ligne de commande inconnue' })
    }
    const reste = ligne.quantite - ligne.quantiteRecue
    if (recu.quantite > reste) {
      throw createError({
        statusCode: 400,
        message: `Réception (${recu.quantite}) supérieure au reste à recevoir (${reste})`,
      })
    }
  }

  await db.transaction(async (tx) => {
    for (const recu of body.lignes) {
      const ligne = lignesParId.get(recu.ligneId)!
      await tx
        .update(articles)
        .set({
          stockActuel: sql`${articles.stockActuel} + ${recu.quantite}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(articles.id, ligne.articleId))
      await tx
        .update(lignesCommande)
        .set({ quantiteRecue: sql`${lignesCommande.quantiteRecue} + ${recu.quantite}` })
        .where(eq(lignesCommande.id, ligne.id))
      await tx.insert(mouvements).values({
        id: generateId(),
        articleId: ligne.articleId,
        type: 'entree',
        quantite: recu.quantite,
        fournisseurId: commande.fournisseurId,
        motif: `Réception commande ${commande.reference}`,
      })
    }

    // Recalcule le statut à partir du cumul reçu de toutes les lignes.
    const apres = await tx.select().from(lignesCommande).where(eq(lignesCommande.commandeId, id))
    const totalReçu = apres.every((l) => l.quantiteRecue >= l.quantite)
    const partiel = apres.some((l) => l.quantiteRecue > 0)
    const statut = totalReçu ? 'recue' : partiel ? 'partielle' : commande.statut
    await tx.update(commandes).set({ statut }).where(eq(commandes.id, id))
  })

  return { success: true }
})
