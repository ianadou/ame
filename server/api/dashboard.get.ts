import { eq, sql, lte, desc, and } from 'drizzle-orm'
import { db } from '../db'
import { articles, clients, sorties, mouvements, fournisseurs, categories } from '../db/schema'

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

  // Top catégories par valeur de stock (stock × prix)
  const topCategories = await db
    .select({
      nom: categories.nom,
      valeur: sql<number>`coalesce(sum(${articles.stockActuel} * coalesce(${articles.prixUnitaire}, 0)), 0)`,
      nb: sql<number>`count(${articles.id})`,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categorieId, categories.id))
    .groupBy(categories.id)
    .orderBy(
      desc(sql`coalesce(sum(${articles.stockActuel} * coalesce(${articles.prixUnitaire}, 0)), 0)`),
    )
    .limit(6)

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

  // Couverture (en quantités) et rotation (en valeur) sur 30 jours.
  // Deux bases différentes (unités vs FCFA) → deux indicateurs distincts.
  const il30j = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  const [{ sortiesUnits, sortiesValeur }] = await db
    .select({
      sortiesUnits: sql<number>`coalesce(sum(${mouvements.quantite}), 0)`,
      sortiesValeur: sql<number>`coalesce(sum(${mouvements.quantite} * coalesce(${articles.prixUnitaire}, 0)), 0)`,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .where(and(eq(mouvements.type, 'sortie'), sql`${mouvements.createdAt} >= ${il30j}`))
  const [{ stockUnits }] = await db
    .select({ stockUnits: sql<number>`coalesce(sum(${articles.stockActuel}), 0)` })
    .from(articles)

  const couvertureJours = sortiesUnits > 0 ? Math.round(stockUnits / (sortiesUnits / 30)) : 0
  const rotationJours = sortiesValeur > 0 ? Math.round(stats.valeurStock / (sortiesValeur / 30)) : 0

  return {
    nbArticles: stats.nbArticles,
    valeurStock: stats.valeurStock,
    nbAlertes,
    nbClients,
    derniersMouvements,
    topCategories: topCategories.map((c) => ({
      nom: c.nom,
      valeur: Math.round(c.valeur),
      sub: `${c.nb} art.`,
    })),
    topClients: topClients.map((c) => ({
      nom: c.nom,
      valeur: Math.round(c.valeur),
      sub: `${c.nb} sorties`,
    })),
    rotationJours,
    couvertureJours,
  }
})
