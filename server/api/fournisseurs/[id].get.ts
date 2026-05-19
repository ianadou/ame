import { eq, desc, and } from 'drizzle-orm'
import { db } from '../../db'
import { fournisseurs, commandes, mouvements, articles } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [fournisseur] = await db.select().from(fournisseurs).where(eq(fournisseurs.id, id))

  if (!fournisseur) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable' })
  }

  const commandesLiees = await db
    .select({
      id: commandes.id,
      reference: commandes.reference,
      statut: commandes.statut,
      dateCommande: commandes.dateCommande,
      dateLivraisonPrevue: commandes.dateLivraisonPrevue,
      createdAt: commandes.createdAt,
    })
    .from(commandes)
    .where(eq(commandes.fournisseurId, id))
    .orderBy(desc(commandes.createdAt))
    .limit(20)

  const entrees = await db
    .select({
      id: mouvements.id,
      quantite: mouvements.quantite,
      articleNom: articles.nom,
      bonLivraison: mouvements.bonLivraison,
      createdAt: mouvements.createdAt,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .where(and(eq(mouvements.fournisseurId, id), eq(mouvements.type, 'entree')))
    .orderBy(desc(mouvements.createdAt))
    .limit(20)

  return { ...fournisseur, commandes: commandesLiees, entrees }
})
