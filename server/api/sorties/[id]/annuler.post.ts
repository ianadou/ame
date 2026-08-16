import { eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { sorties, lignesSortie, articles, mouvements, retours } from '../../../db/schema'
import { annulerSortieSchema } from '../../../utils/validation'
import { generateId } from '../../../utils/helpers'

/**
 * Annule un bon de sortie en CONTRE-PASSANT (jamais de suppression) :
 *  - statut → 'annule', date + motif renseignés
 *  - restitution du stock article par article
 *  - mouvement d'entrée par ligne (type 'entree', lié à sortie_id) pour
 *    laisser une trace auditable dans le journal des transactions.
 * Idempotence : refus 409 si déjà annulé.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, annulerSortieSchema.parse)

  const [sortie] = await db.select().from(sorties).where(eq(sorties.id, id))
  if (!sortie) {
    throw createError({ statusCode: 404, message: 'Bon de sortie introuvable' })
  }
  if (sortie.statut === 'annule') {
    throw createError({ statusCode: 409, message: 'Ce bon de sortie est déjà annulé' })
  }

  // Un retour a déjà réintégré une partie du stock : contre-passer le bon
  // entier le compterait une seconde fois. On bloque plutôt que de tenter
  // une compensation partielle silencieuse.
  const [{ nbRetours } = { nbRetours: 0 }] = await db
    .select({ nbRetours: sql<number>`count(*)` })
    .from(retours)
    .innerJoin(lignesSortie, eq(retours.ligneSortieId, lignesSortie.id))
    .where(eq(lignesSortie.sortieId, id))

  if (nbRetours > 0) {
    throw createError({
      statusCode: 409,
      message:
        'Ce bon a déjà des retours enregistrés. Annulez-les d’abord ou faites un ajustement de stock.',
    })
  }

  const lignes = await db.select().from(lignesSortie).where(eq(lignesSortie.sortieId, id))

  await db.transaction(async (tx) => {
    await tx
      .update(sorties)
      .set({
        statut: 'annule',
        annuleLe: sql`(datetime('now'))`,
        motifAnnulation: body.motif,
      })
      .where(eq(sorties.id, id))

    for (const ligne of lignes) {
      await tx
        .update(articles)
        .set({
          stockActuel: sql`${articles.stockActuel} + ${ligne.quantite}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(articles.id, ligne.articleId))

      await tx.insert(mouvements).values({
        id: generateId(),
        articleId: ligne.articleId,
        type: 'entree',
        quantite: ligne.quantite,
        sortieId: id,
        motif: `Annulation bon de sortie ${sortie.reference} · ${body.motif}`,
      })
    }
  })

  return { success: true }
})
