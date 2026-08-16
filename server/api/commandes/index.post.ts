import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { commandes, lignesCommande, fournisseurs, parametres } from '../../db/schema'
import { createCommandeSchema } from '../../utils/validation'
import { generateId, generateCommandeReference } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createCommandeSchema.parse)

  const [fournisseur] = await db
    .select({ id: fournisseurs.id })
    .from(fournisseurs)
    .where(eq(fournisseurs.id, body.fournisseurId))
  if (!fournisseur) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable' })
  }

  // Fige le taux TVA selon le régime actuel (cf. /sorties POST).
  const [param] = await db.select().from(parametres).where(eq(parametres.id, 'app'))
  const tauxTvaApplique = param?.regimeTva === 'assujetti' ? (param?.tauxTva ?? 18) : null

  const commandeId = generateId()
  const commande = {
    id: commandeId,
    reference: generateCommandeReference(),
    fournisseurId: body.fournisseurId,
    statut: 'brouillon',
    dateCommande: body.dateCommande ?? null,
    dateLivraisonPrevue: body.dateLivraisonPrevue ?? null,
    notes: body.notes ?? null,
    tauxTvaApplique,
  }

  const lignes = body.lignes.map((ligne) => ({
    id: generateId(),
    commandeId,
    articleId: ligne.articleId,
    quantite: ligne.quantite,
    quantiteRecue: 0,
    prixUnitaire: ligne.prixUnitaire ?? null,
  }))

  await db.transaction(async (tx) => {
    await tx.insert(commandes).values(commande)
    await tx.insert(lignesCommande).values(lignes)
  })

  setResponseStatus(event, 201)
  return { ...commande, lignes }
})
