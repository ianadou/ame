import { eq, lte, sql, and } from 'drizzle-orm'
import { db } from '../../db'
import { articles, categories } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const categorie = query.categorie as string | undefined
  const alerte = query.alerte === 'true'
  const inclureArchives = query.inclureArchives === '1' || query.inclureArchives === 'true'
  const seulementArchives = query.seulementArchives === '1' || query.seulementArchives === 'true'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const conditions = []

  if (search) {
    conditions.push(
      sql`(${articles.nom} LIKE ${'%' + search + '%'} OR ${articles.reference} LIKE ${'%' + search + '%'})`,
    )
  }

  if (categorie) {
    conditions.push(eq(articles.categorieId, categorie))
  }

  if (alerte) {
    conditions.push(lte(articles.stockActuel, articles.seuilAlerte))
  }

  // Par défaut : actifs uniquement. `inclureArchives=1` montre tout (actif +
  // archive). `seulementArchives=1` ne montre que les archivés (utile pour
  // un onglet ou un filtre dédié si besoin plus tard).
  if (seulementArchives) {
    conditions.push(eq(articles.statut, 'archive'))
  } else if (!inclureArchives) {
    conditions.push(eq(articles.statut, 'actif'))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db
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
        statut: articles.statut,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categorieId, categories.id))
      .where(where)
      .orderBy(articles.nom)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(where),
  ])

  return {
    data,
    total: countResult[0].count,
    page,
    limit,
  }
})
