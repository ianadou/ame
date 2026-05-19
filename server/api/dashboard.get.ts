import { eq, sql, lte, desc } from 'drizzle-orm'
import { db } from '../db'
import { articles, chantiers, mouvements, fournisseurs } from '../db/schema'

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

  const [{ nbChantiersEnCours }] = await db
    .select({ nbChantiersEnCours: sql<number>`count(*)` })
    .from(chantiers)
    .where(eq(chantiers.statut, 'en_cours'))

  const derniersMouvements = await db
    .select({
      id: mouvements.id,
      type: mouvements.type,
      quantite: mouvements.quantite,
      articleId: mouvements.articleId,
      articleNom: articles.nom,
      articleReference: articles.reference,
      fournisseurNom: fournisseurs.nom,
      chantierNom: chantiers.nom,
      createdAt: mouvements.createdAt,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .leftJoin(chantiers, eq(mouvements.chantierId, chantiers.id))
    .orderBy(desc(mouvements.createdAt))
    .limit(5)

  return {
    nbArticles: stats.nbArticles,
    valeurStock: stats.valeurStock,
    nbAlertes,
    nbChantiersEnCours,
    derniersMouvements,
  }
})
