import { eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { articles } from '../../../db/schema'

/**
 * Restaure un article archivé : repasse statut à 'actif', vide archive_le
 * et motif_archivage (CHECK articles_archivage_coherent l'exige). Pas de
 * motif requis : la restauration est neutre.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [article] = await db.select().from(articles).where(eq(articles.id, id))
  if (!article) {
    throw createError({ statusCode: 404, message: 'Article introuvable' })
  }
  if (article.statut === 'actif') {
    throw createError({ statusCode: 409, message: 'Cet article est déjà actif' })
  }

  await db
    .update(articles)
    .set({
      statut: 'actif',
      archiveLe: null,
      motifArchivage: null,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(articles.id, id))

  return { success: true }
})
