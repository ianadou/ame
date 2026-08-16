import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { sorties, reglements } from '../../../db/schema'
import { createReglementSchema } from '../../../utils/validation'
import { recalculerPaiement } from '../../../utils/reglements'
import { generateId } from '../../../utils/helpers'

/**
 * Enregistre un encaissement reçu sur un bon. L'app ne déplace pas d'argent :
 * elle inscrit qui a payé quoi, quand et par quel canal, puis recalcule le
 * statut du bon depuis la somme de ses règlements.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, createReglementSchema.parse)

  const [sortie] = await db.select().from(sorties).where(eq(sorties.id, id))
  if (!sortie) {
    throw createError({ statusCode: 404, message: 'Bon introuvable' })
  }
  if (sortie.statut === 'annule') {
    throw createError({
      statusCode: 409,
      message: `Le bon ${sortie.reference} est annulé : il n'y a plus rien à encaisser dessus.`,
    })
  }

  // On refuse d'encaisser plus que le montant du bon : un trop-perçu est une
  // erreur de saisie, pas un état à représenter.
  const reste = sortie.montantTotal - sortie.montantPaye
  if (body.montant > reste + 0.5) {
    throw createError({
      statusCode: 400,
      message: `Montant trop élevé : il reste ${Math.round(reste)} FCFA à régler sur ce bon.`,
    })
  }

  const reglement = {
    id: generateId(),
    sortieId: id,
    montant: body.montant,
    dateReglement: body.dateReglement ?? new Date().toISOString().slice(0, 10),
    mode: body.mode,
    reference: body.reference ?? null,
    notes: body.notes ?? null,
  }

  const totaux = await db.transaction(async (tx) => {
    await tx.insert(reglements).values(reglement)
    return recalculerPaiement(tx, id)
  })

  setResponseStatus(event, 201)
  return { ...reglement, ...totaux }
})
