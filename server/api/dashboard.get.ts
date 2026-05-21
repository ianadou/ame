import { eq, sql, lte, desc } from 'drizzle-orm'
import { db } from '../db'
import { articles, clients, sorties, mouvements, fournisseurs } from '../db/schema'

export default defineEventHandler(async () => {
  const [stats] = await db
    .select({
      nbArticles: sql<number>`count(*)`,
      valeurStock: sql<number>`coalesce(sum(${articles.stockActuel} * coalesce(${articles.prixUnitaire}, 0)), 0)`,
    })
    .from(articles)

  const [{ nbAlertes }] = await db
    .select({ nbAlertes: sql<number>`count(*)` })
    .from(articles)
    .where(lte(articles.stockActuel, articles.seuilAlerte))

  const [{ nbClients }] = await db.select({ nbClients: sql<number>`count(*)` }).from(clients)

  const derniersMouvements = await db
    .select({
      id: mouvements.id,
      type: mouvements.type,
      quantite: mouvements.quantite,
      articleId: mouvements.articleId,
      articleNom: articles.nom,
      articleReference: articles.reference,
      fournisseurNom: fournisseurs.nom,
      clientNom: clients.nom,
      createdAt: mouvements.createdAt,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .leftJoin(sorties, eq(mouvements.sortieId, sorties.id))
    .leftJoin(clients, eq(sorties.clientId, clients.id))
    .orderBy(desc(mouvements.createdAt))
    .limit(5)

  // Top clients par montant total des bons de sortie
  const topClients = await db
    .select({
      nom: clients.nom,
      valeur: sql<number>`coalesce(sum(${sorties.montantTotal}), 0)`,
      nb: sql<number>`count(${sorties.id})`,
    })
    .from(sorties)
    .innerJoin(clients, eq(sorties.clientId, clients.id))
    .groupBy(clients.id)
    .orderBy(desc(sql`coalesce(sum(${sorties.montantTotal}), 0)`))
    .limit(6)

  return {
    nbArticles: stats.nbArticles,
    valeurStock: stats.valeurStock,
    nbAlertes,
    nbClients,
    derniersMouvements,
    topClients: topClients.map((c) => ({
      nom: c.nom,
      valeur: Math.round(c.valeur),
      sub: `${c.nb} sorties`,
    })),
  }
})
