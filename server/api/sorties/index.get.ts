import { eq, sql, and, desc } from 'drizzle-orm'
import { db } from '../../db'
import { sorties, clients, lignesSortie } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const statutPaiement = query.statutPaiement as string | undefined

  const conditions = []
  if (search) {
    const like = '%' + search + '%'
    conditions.push(
      sql`(${sorties.reference} LIKE ${like} OR ${clients.nom} LIKE ${like} OR ${sorties.objet} LIKE ${like})`,
    )
  }
  if (statutPaiement) {
    conditions.push(eq(sorties.statutPaiement, statutPaiement))
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select({
      id: sorties.id,
      reference: sorties.reference,
      clientId: sorties.clientId,
      clientNom: clients.nom,
      dateSortie: sorties.dateSortie,
      objet: sorties.objet,
      montantTotal: sorties.montantTotal,
      montantPaye: sorties.montantPaye,
      conditionsReglement: sorties.conditionsReglement,
      statutPaiement: sorties.statutPaiement,
      statut: sorties.statut,
      tauxTvaApplique: sorties.tauxTvaApplique,
      createdAt: sorties.createdAt,
      nbArticles: sql<number>`count(${lignesSortie.id})`,
    })
    .from(sorties)
    .innerJoin(clients, eq(sorties.clientId, clients.id))
    .leftJoin(lignesSortie, eq(lignesSortie.sortieId, sorties.id))
    .where(where)
    .groupBy(sorties.id)
    .orderBy(desc(sorties.createdAt))
})
