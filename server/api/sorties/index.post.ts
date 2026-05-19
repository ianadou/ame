import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import { sorties, lignesSortie, clients, articles, mouvements } from '../../db/schema'
import { createSortieSchema } from '../../utils/validation'
import { generateId, generateSortieReference } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createSortieSchema.parse)

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, body.clientId))
  if (!client) {
    throw createError({ statusCode: 404, message: 'Client introuvable' })
  }

  // Fusionne les lignes en double (même article) : un bon de sortie a une
  // ligne par article, et la vérification de stock doit être cumulée.
  const quantitesParArticle = new Map<string, number>()
  for (const ligne of body.lignes) {
    quantitesParArticle.set(
      ligne.articleId,
      (quantitesParArticle.get(ligne.articleId) ?? 0) + ligne.quantite,
    )
  }
  const articleIds = [...quantitesParArticle.keys()]

  const articlesData = await db.select().from(articles).where(inArray(articles.id, articleIds))

  if (articlesData.length !== articleIds.length) {
    throw createError({ statusCode: 404, message: 'Un ou plusieurs articles sont introuvables' })
  }

  // Vérifie le stock AVANT toute écriture (échec atomique).
  for (const article of articlesData) {
    const demande = quantitesParArticle.get(article.id)!
    if (article.stockActuel < demande) {
      throw createError({
        statusCode: 400,
        message: `Stock insuffisant pour « ${article.nom} » (${article.stockActuel} disponible, ${demande} demandé)`,
      })
    }
  }

  const sortieId = generateId()
  const reference = generateSortieReference()

  // Prix figé au moment de la sortie + stock restant figé par ligne.
  const stockSuivi = new Map(articlesData.map((a) => [a.id, a.stockActuel]))
  const prixParArticle = new Map(articlesData.map((a) => [a.id, a.prixUnitaire ?? 0]))

  const lignes = [...quantitesParArticle.entries()].map(([articleId, quantite]) => {
    const stockApres = stockSuivi.get(articleId)! - quantite
    stockSuivi.set(articleId, stockApres)
    return {
      id: generateId(),
      sortieId,
      articleId,
      quantite,
      prixUnitaire: prixParArticle.get(articleId)!,
      stockApres,
    }
  })

  const montantTotal = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)

  const montantPaye =
    body.statutPaiement === 'paye'
      ? montantTotal
      : body.statutPaiement === 'impaye'
        ? 0
        : Math.min(body.montantPaye ?? 0, montantTotal)

  const sortie = {
    id: sortieId,
    reference,
    clientId: body.clientId,
    dateSortie: body.dateSortie ?? new Date().toISOString().slice(0, 10),
    objet: body.objet ?? null,
    montantTotal,
    modeReglement: body.modeReglement,
    statutPaiement: body.statutPaiement,
    montantPaye,
    notes: body.notes ?? null,
  }

  await db.transaction(async (tx) => {
    await tx.insert(sorties).values(sortie)
    await tx.insert(lignesSortie).values(lignes)

    for (const ligne of lignes) {
      await tx
        .update(articles)
        .set({
          stockActuel: sql`${articles.stockActuel} - ${ligne.quantite}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(articles.id, ligne.articleId))

      await tx.insert(mouvements).values({
        id: generateId(),
        articleId: ligne.articleId,
        type: 'sortie',
        quantite: ligne.quantite,
        sortieId,
        motif: `Bon de sortie ${reference}`,
      })
    }
  })

  setResponseStatus(event, 201)
  return { ...sortie, lignes }
})
