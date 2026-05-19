import { eq, desc, and, sql } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers, mouvements, articles } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [chantier] = await db.select().from(chantiers).where(eq(chantiers.id, id))

  if (!chantier) {
    throw createError({ statusCode: 404, message: 'Chantier introuvable' })
  }

  const stockConsomme = await db
    .select({
      articleId: articles.id,
      reference: articles.reference,
      nom: articles.nom,
      unite: articles.unite,
      quantiteTotale: sql<number>`sum(${mouvements.quantite})`,
    })
    .from(mouvements)
    .innerJoin(articles, eq(mouvements.articleId, articles.id))
    .where(and(eq(mouvements.chantierId, id), eq(mouvements.type, 'sortie')))
    .groupBy(articles.id)
    .orderBy(articles.nom)

  const derniersMouvements = await db
    .select({
      id: mouvements.id,
      quantite: mouvements.quantite,
      articleNom: articles.nom,
      motif: mouvements.motif,
      createdAt: mouvements.createdAt,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .where(and(eq(mouvements.chantierId, id), eq(mouvements.type, 'sortie')))
    .orderBy(desc(mouvements.createdAt))
    .limit(20)

  return { ...chantier, stockConsomme, mouvements: derniersMouvements }
})
