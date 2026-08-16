import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { lignesSortie, sorties, articles, chantiers, beneficiaires, retours } from '../../db/schema'

/**
 * Matériel encore dehors : lignes de bons actifs portant un article
 * retournable dont la quantité rendue ne couvre pas encore la quantité
 * sortie. Filtrable par chantier ou par bénéficiaire (fiche chantier vs
 * page Retours globale).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const chantierId = query.chantierId as string | undefined
  const beneficiaireId = query.beneficiaireId as string | undefined

  const quantiteRetournee = sql<number>`coalesce((
    select sum(${retours.quantite}) from ${retours}
    where ${retours.ligneSortieId} = ${lignesSortie.id}
  ), 0)`

  const conditions = [
    eq(articles.retournable, true),
    eq(sorties.statut, 'actif'),
    sql`${lignesSortie.quantite} > ${quantiteRetournee}`,
  ]

  if (chantierId) conditions.push(eq(sorties.chantierId, chantierId))
  if (beneficiaireId) conditions.push(eq(sorties.beneficiaireId, beneficiaireId))

  return db
    .select({
      ligneSortieId: lignesSortie.id,
      sortieId: sorties.id,
      reference: sorties.reference,
      dateSortie: sorties.dateSortie,
      articleId: articles.id,
      articleReference: articles.reference,
      articleNom: articles.nom,
      unite: articles.unite,
      quantite: lignesSortie.quantite,
      quantiteRetournee,
      restant: sql<number>`${lignesSortie.quantite} - ${quantiteRetournee}`,
      chantierId: sorties.chantierId,
      chantierNom: chantiers.nom,
      beneficiaireId: sorties.beneficiaireId,
      beneficiaireNom: beneficiaires.nom,
    })
    .from(lignesSortie)
    .innerJoin(sorties, eq(lignesSortie.sortieId, sorties.id))
    .innerJoin(articles, eq(lignesSortie.articleId, articles.id))
    .leftJoin(chantiers, eq(sorties.chantierId, chantiers.id))
    .leftJoin(beneficiaires, eq(sorties.beneficiaireId, beneficiaires.id))
    .where(and(...conditions))
    .orderBy(sorties.dateSortie, articles.nom)
})
