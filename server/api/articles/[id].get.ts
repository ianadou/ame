import { eq, desc } from 'drizzle-orm'
import { db } from '../../db'
import { articles, categories, mouvements, fournisseurs, sorties, clients } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [article] = await db
    .select({
      id: articles.id,
      reference: articles.reference,
      nom: articles.nom,
      categorieId: articles.categorieId,
      categorieNom: categories.nom,
      unite: articles.unite,
      prixUnitaire: articles.prixUnitaire,
      stockActuel: articles.stockActuel,
      seuilAlerte: articles.seuilAlerte,
      emplacement: articles.emplacement,
      notes: articles.notes,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categorieId, categories.id))
    .where(eq(articles.id, id))

  if (!article) {
    throw createError({ statusCode: 404, message: 'Article introuvable' })
  }

  const derniersMouvements = await db
    .select({
      id: mouvements.id,
      type: mouvements.type,
      quantite: mouvements.quantite,
      fournisseurNom: fournisseurs.nom,
      clientNom: clients.nom,
      bonLivraison: mouvements.bonLivraison,
      motif: mouvements.motif,
      createdAt: mouvements.createdAt,
    })
    .from(mouvements)
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .leftJoin(sorties, eq(mouvements.sortieId, sorties.id))
    .leftJoin(clients, eq(sorties.clientId, clients.id))
    .where(eq(mouvements.articleId, id))
    .orderBy(desc(mouvements.createdAt))
    .limit(20)

  return { ...article, mouvements: derniersMouvements }
})
