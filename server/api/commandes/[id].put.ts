import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { commandes, lignesCommande, articles, mouvements } from '../../db/schema'
import { updateCommandeSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateCommandeSchema.parse)

  const [existing] = await db.select().from(commandes).where(eq(commandes.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Commande introuvable' })
  }

  // Les lignes ne sont modifiables qu'en brouillon
  if (body.lignes && existing.statut !== 'brouillon') {
    throw createError({
      statusCode: 400,
      message: 'Les lignes ne sont modifiables que sur une commande en brouillon',
    })
  }

  const champs: Record<string, unknown> = {}
  if (body.statut !== undefined) champs.statut = body.statut
  if (body.dateCommande !== undefined) champs.dateCommande = body.dateCommande
  if (body.dateLivraisonPrevue !== undefined) champs.dateLivraisonPrevue = body.dateLivraisonPrevue
  if (body.notes !== undefined) champs.notes = body.notes

  const receptionne = body.statut === 'recue' && existing.statut !== 'recue'

  await db.transaction(async (tx) => {
    if (body.lignes) {
      await tx.delete(lignesCommande).where(eq(lignesCommande.commandeId, id))
      await tx.insert(lignesCommande).values(
        body.lignes.map((ligne) => ({
          id: generateId(),
          commandeId: id,
          articleId: ligne.articleId,
          quantite: ligne.quantite,
          quantiteRecue: 0,
          prixUnitaire: ligne.prixUnitaire ?? null,
        })),
      )
    }

    if (receptionne) {
      const lignes = await tx.select().from(lignesCommande).where(eq(lignesCommande.commandeId, id))

      for (const ligne of lignes) {
        await tx.insert(mouvements).values({
          id: generateId(),
          articleId: ligne.articleId,
          type: 'entree',
          quantite: ligne.quantite,
          fournisseurId: existing.fournisseurId,
          motif: `Réception commande ${existing.reference}`,
        })
        await tx
          .update(articles)
          .set({
            stockActuel: sql`${articles.stockActuel} + ${ligne.quantite}`,
            updatedAt: sql`(datetime('now'))`,
          })
          .where(eq(articles.id, ligne.articleId))
        await tx
          .update(lignesCommande)
          .set({ quantiteRecue: ligne.quantite })
          .where(eq(lignesCommande.id, ligne.id))
      }
    }

    if (Object.keys(champs).length > 0) {
      await tx.update(commandes).set(champs).where(eq(commandes.id, id))
    }
  })

  return { ...existing, ...champs }
})
