import { eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { articles, mouvements } from '../../../db/schema'
import { ajustementSchema } from '../../../utils/validation'
import { generateId } from '../../../utils/helpers'

/**
 * Ajustement de stock manuel : réconcilie le stock théorique avec un
 * inventaire physique. Une transaction `ajustement_positif` ou
 * `ajustement_negatif` est inscrite au journal pour traçabilité (motif
 * obligatoire). Le delta nul est refusé : pas d'écriture pour rien.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, ajustementSchema.parse)

  const [article] = await db.select().from(articles).where(eq(articles.id, id))
  if (!article) {
    throw createError({ statusCode: 404, message: 'Article introuvable' })
  }

  const delta = body.stockPhysique - article.stockActuel
  if (delta === 0) {
    throw createError({ statusCode: 400, message: 'Aucun écart à enregistrer' })
  }

  await db.transaction(async (tx) => {
    await tx
      .update(articles)
      .set({
        stockActuel: body.stockPhysique,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(articles.id, id))

    await tx.insert(mouvements).values({
      id: generateId(),
      articleId: id,
      type: delta > 0 ? 'ajustement_positif' : 'ajustement_negatif',
      quantite: Math.abs(delta),
      motif: body.motif,
    })
  })

  return { delta, stockApres: body.stockPhysique }
})
