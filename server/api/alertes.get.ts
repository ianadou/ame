import { eq, lte, asc } from 'drizzle-orm'
import { db } from '../db'
import { articles, categories } from '../db/schema'

export default defineEventHandler(async () => {
  return db
    .select({
      id: articles.id,
      reference: articles.reference,
      nom: articles.nom,
      categorieNom: categories.nom,
      unite: articles.unite,
      stockActuel: articles.stockActuel,
      seuilAlerte: articles.seuilAlerte,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categorieId, categories.id))
    .where(lte(articles.stockActuel, articles.seuilAlerte))
    .orderBy(asc(articles.stockActuel))
})
