import { eq, desc, sql, and, gte, lte } from 'drizzle-orm'
import { db } from '../../db'
import { mouvements, articles, fournisseurs, chantiers } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const articleId = query.article as string | undefined
  const chantierId = query.chantier as string | undefined
  const fournisseurId = query.fournisseur as string | undefined
  const type = query.type as string | undefined
  const dateDebut = query.dateDebut as string | undefined
  const dateFin = query.dateFin as string | undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const conditions = []

  if (articleId) conditions.push(eq(mouvements.articleId, articleId))
  if (chantierId) conditions.push(eq(mouvements.chantierId, chantierId))
  if (fournisseurId) conditions.push(eq(mouvements.fournisseurId, fournisseurId))
  if (type === 'entree' || type === 'sortie') conditions.push(eq(mouvements.type, type))
  if (dateDebut) conditions.push(gte(mouvements.createdAt, dateDebut))
  if (dateFin) conditions.push(lte(mouvements.createdAt, dateFin + 'T23:59:59'))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: mouvements.id,
        type: mouvements.type,
        quantite: mouvements.quantite,
        bonLivraison: mouvements.bonLivraison,
        motif: mouvements.motif,
        createdAt: mouvements.createdAt,
        articleReference: articles.reference,
        articleNom: articles.nom,
        fournisseurNom: fournisseurs.nom,
        chantierNom: chantiers.nom,
      })
      .from(mouvements)
      .leftJoin(articles, eq(mouvements.articleId, articles.id))
      .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
      .leftJoin(chantiers, eq(mouvements.chantierId, chantiers.id))
      .where(where)
      .orderBy(desc(mouvements.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(mouvements)
      .where(where),
  ])

  return {
    data,
    total: countResult[0].count,
    page,
    limit,
  }
})
