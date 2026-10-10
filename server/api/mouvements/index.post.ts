import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { articles, mouvements } from '../../db/schema'
import { createMouvementSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'
import { DECIMALES_QUANTITE, formatQuantite } from '../../../shared/utils/quantites'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createMouvementSchema.parse)

  const [article] = await db.select().from(articles).where(eq(articles.id, body.articleId))
  if (!article) {
    throw createError({ statusCode: 404, message: 'Article introuvable' })
  }

  if (body.type === 'sortie' && article.stockActuel < body.quantite) {
    throw createError({
      statusCode: 400,
      message: `Stock insuffisant (${formatQuantite(article.stockActuel)} disponible, ${formatQuantite(body.quantite)} demandé)`,
    })
  }

  const mouvement = {
    id: generateId(),
    ...body,
  }

  await db.insert(mouvements).values(mouvement)

  const stockChange = body.type === 'entree' ? body.quantite : -body.quantite
  await db
    .update(articles)
    .set({
      stockActuel: sql`round(${articles.stockActuel} + ${stockChange}, ${DECIMALES_QUANTITE})`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(articles.id, body.articleId))

  setResponseStatus(event, 201)
  return mouvement
})
