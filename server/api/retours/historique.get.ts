import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { retours, lignesSortie, sorties, articles, chantiers, beneficiaires } from '../../db/schema'

/**
 * Retours déjà enregistrés. La page Retours ne montrait que ce qui est encore
 * dehors : le matériel rendu, et surtout celui rendu endommagé, n'était
 * lisible nulle part, sauf à déduire des lignes « entrée » du journal.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const chantierId = query.chantierId as string | undefined
  const beneficiaireId = query.beneficiaireId as string | undefined

  const conditions = []
  if (chantierId) conditions.push(eq(sorties.chantierId, chantierId))
  if (beneficiaireId) conditions.push(eq(sorties.beneficiaireId, beneficiaireId))

  return db
    .select({
      id: retours.id,
      quantite: retours.quantite,
      dateRetour: retours.dateRetour,
      etat: retours.etat,
      notes: retours.notes,
      articleNom: articles.nom,
      articleReference: articles.reference,
      unite: articles.unite,
      sortieId: sorties.id,
      reference: sorties.reference,
      chantierId: sorties.chantierId,
      chantierNom: chantiers.nom,
      beneficiaireId: sorties.beneficiaireId,
      beneficiaireNom: beneficiaires.nom,
    })
    .from(retours)
    .innerJoin(lignesSortie, eq(retours.ligneSortieId, lignesSortie.id))
    .innerJoin(sorties, eq(lignesSortie.sortieId, sorties.id))
    .innerJoin(articles, eq(lignesSortie.articleId, articles.id))
    .leftJoin(chantiers, eq(sorties.chantierId, chantiers.id))
    .leftJoin(beneficiaires, eq(sorties.beneficiaireId, beneficiaires.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(retours.dateRetour), desc(retours.createdAt))
})
