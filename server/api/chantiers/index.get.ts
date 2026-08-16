import { eq, sql, and } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers, clients } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const statut = query.statut as string | undefined

  const conditions = []

  if (search) {
    const like = '%' + search + '%'
    conditions.push(sql`(${chantiers.nom} LIKE ${like} OR ${chantiers.ville} LIKE ${like})`)
  }

  if (statut) {
    conditions.push(eq(chantiers.statut, statut))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select({
      id: chantiers.id,
      nom: chantiers.nom,
      ville: chantiers.ville,
      adresse: chantiers.adresse,
      statut: chantiers.statut,
      clientId: chantiers.clientId,
      clientNom: clients.nom,
      budgetAlloue: chantiers.budgetAlloue,
      dateDebut: chantiers.dateDebut,
      dateFinPrevue: chantiers.dateFinPrevue,
      notes: chantiers.notes,
      createdAt: chantiers.createdAt,
      updatedAt: chantiers.updatedAt,
    })
    .from(chantiers)
    .leftJoin(clients, eq(clients.id, chantiers.clientId))
    .where(where)
    .orderBy(chantiers.nom)
})
