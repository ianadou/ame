import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import { mouvements, articles, fournisseurs, sorties, clients } from '../../db/schema'
import { TYPES_ENTRANTS, estEntrant } from '../../../shared/utils/mouvements'

/**
 * Détail enrichi d'une transaction de stock. Reconstitue le stock avant/après
 * en partant du stock courant et en retirant l'effet des transactions
 * postérieures (signe selon le type). Imprécision possible pour deux
 * transactions à la même seconde sur le même article (cas rare, on accepte).
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [mvt] = await db
    .select({
      id: mouvements.id,
      type: mouvements.type,
      quantite: mouvements.quantite,
      bonLivraison: mouvements.bonLivraison,
      motif: mouvements.motif,
      createdAt: mouvements.createdAt,
      articleId: mouvements.articleId,
      articleReference: articles.reference,
      articleNom: articles.nom,
      articleUnite: articles.unite,
      stockActuel: articles.stockActuel,
      fournisseurId: mouvements.fournisseurId,
      fournisseurNom: fournisseurs.nom,
      sortieId: mouvements.sortieId,
      sortieReference: sorties.reference,
      clientId: sorties.clientId,
      clientNom: clients.nom,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .leftJoin(sorties, eq(mouvements.sortieId, sorties.id))
    .leftJoin(clients, eq(sorties.clientId, clients.id))
    .where(eq(mouvements.id, id))

  if (!mvt) {
    throw createError({ statusCode: 404, message: 'Transaction introuvable' })
  }

  // Somme signée des transactions postérieures (strictement) sur ce même article.
  const [{ posterieures }] = await db
    .select({
      posterieures: sql<number>`coalesce(sum(
        CASE WHEN ${inArray(mouvements.type, TYPES_ENTRANTS)}
          THEN ${mouvements.quantite}
          ELSE -${mouvements.quantite}
        END
      ), 0)`,
    })
    .from(mouvements)
    .where(
      and(eq(mouvements.articleId, mvt.articleId), sql`${mouvements.createdAt} > ${mvt.createdAt}`),
    )

  const stockApres = (mvt.stockActuel ?? 0) - posterieures
  const signe = estEntrant(mvt.type) ? 1 : -1
  const stockAvant = stockApres - signe * mvt.quantite

  return {
    id: mvt.id,
    type: mvt.type,
    quantite: mvt.quantite,
    signe,
    bonLivraison: mvt.bonLivraison,
    motif: mvt.motif,
    createdAt: mvt.createdAt,
    article: {
      id: mvt.articleId,
      reference: mvt.articleReference,
      nom: mvt.articleNom,
      unite: mvt.articleUnite,
    },
    fournisseur:
      mvt.fournisseurId && mvt.fournisseurNom
        ? { id: mvt.fournisseurId, nom: mvt.fournisseurNom }
        : null,
    sortie:
      mvt.sortieId && mvt.sortieReference
        ? {
            id: mvt.sortieId,
            reference: mvt.sortieReference,
            clientId: mvt.clientId,
            clientNom: mvt.clientNom,
          }
        : null,
    stockAvant,
    stockApres,
  }
})
