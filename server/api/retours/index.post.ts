import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { retours, lignesSortie, sorties, articles, mouvements } from '../../db/schema'
import { createRetourSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

/**
 * Enregistre le retour d'un matériel prêté :
 *  - 'bon' : le stock est réincrémenté et une transaction d'entrée est
 *    inscrite au journal, comme pour une annulation partielle.
 *  - 'endommage' : la ligne est soldée sans réintégration — l'article ne
 *    revient pas à l'inventaire, la perte reste visible dans l'historique.
 * Les retours partiels sont acceptés tant que le cumul ne dépasse pas la
 * quantité sortie.
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createRetourSchema.parse)

  const [ligne] = await db
    .select({
      id: lignesSortie.id,
      quantite: lignesSortie.quantite,
      articleId: lignesSortie.articleId,
      articleNom: articles.nom,
      retournable: articles.retournable,
      sortieId: sorties.id,
      reference: sorties.reference,
      statutSortie: sorties.statut,
      quantiteRetournee: sql<number>`coalesce((
        select sum(${retours.quantite}) from ${retours}
        where ${retours.ligneSortieId} = ${lignesSortie.id}
      ), 0)`,
    })
    .from(lignesSortie)
    .innerJoin(sorties, eq(lignesSortie.sortieId, sorties.id))
    .innerJoin(articles, eq(lignesSortie.articleId, articles.id))
    .where(eq(lignesSortie.id, body.ligneSortieId))

  if (!ligne) {
    throw createError({ statusCode: 404, message: 'Ligne de bon introuvable' })
  }
  if (ligne.statutSortie === 'annule') {
    throw createError({
      statusCode: 409,
      message: `Le bon ${ligne.reference} est annulé : son stock a déjà été restitué.`,
    })
  }
  if (!ligne.retournable) {
    throw createError({
      statusCode: 400,
      message: `« ${ligne.articleNom} » n’est pas marqué retournable.`,
    })
  }

  const restant = ligne.quantite - ligne.quantiteRetournee
  if (body.quantite > restant) {
    throw createError({
      statusCode: 400,
      message: `Quantité trop élevée : ${restant} restant(s) à rendre sur cette ligne.`,
    })
  }

  const retour = {
    id: generateId(),
    ligneSortieId: body.ligneSortieId,
    quantite: body.quantite,
    dateRetour: body.dateRetour ?? new Date().toISOString().slice(0, 10),
    etat: body.etat,
    notes: body.notes ?? null,
  }

  await db.transaction(async (tx) => {
    await tx.insert(retours).values(retour)

    if (retour.etat === 'bon') {
      await tx
        .update(articles)
        .set({
          stockActuel: sql`${articles.stockActuel} + ${retour.quantite}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(articles.id, ligne.articleId))

      await tx.insert(mouvements).values({
        id: generateId(),
        articleId: ligne.articleId,
        type: 'entree',
        quantite: retour.quantite,
        sortieId: ligne.sortieId,
        motif: `Retour matériel · bon ${ligne.reference}`,
      })
    }
  })

  setResponseStatus(event, 201)
  return { ...retour, restant: restant - retour.quantite }
})
