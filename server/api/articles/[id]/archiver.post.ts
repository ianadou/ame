import { eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { articles } from '../../../db/schema'
import { archiverArticleSchema } from '../../../utils/validation'

/**
 * Archive un article (soft-delete) : il disparaît des sélecteurs métier
 * (nouvelles commandes, sorties, mouvements) mais reste consultable et
 * conserve son historique de transactions. Restauration via /restaurer.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, archiverArticleSchema.parse)

  const [article] = await db.select().from(articles).where(eq(articles.id, id))
  if (!article) {
    throw createError({ statusCode: 404, message: 'Article introuvable' })
  }
  if (article.statut === 'archive') {
    throw createError({ statusCode: 409, message: 'Cet article est déjà archivé' })
  }

  await db
    .update(articles)
    .set({
      statut: 'archive',
      archiveLe: sql`(datetime('now'))`,
      motifArchivage: body.motif,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(articles.id, id))

  return { success: true }
})
