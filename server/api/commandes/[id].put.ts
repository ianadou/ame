import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { commandes, lignesCommande } from '../../db/schema'
import { updateCommandeSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateCommandeSchema.parse)

  const [existing] = await db.select().from(commandes).where(eq(commandes.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Commande introuvable' })
  }

  // Les statuts « partielle » et « recue » sont pilotés par les réceptions
  // (POST /api/commandes/:id/reception) qui mettent le stock à jour.
  if (body.statut === 'recue' || body.statut === 'partielle') {
    throw createError({
      statusCode: 400,
      message: 'Le passage en « reçue » se fait via une réception de commande',
    })
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

    if (Object.keys(champs).length > 0) {
      await tx.update(commandes).set(champs).where(eq(commandes.id, id))
    }
  })

  return { ...existing, ...champs }
})
