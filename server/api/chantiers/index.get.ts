import { eq, sql, and } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const statut = query.statut as string | undefined

  const conditions = []

  if (search) {
    conditions.push(
      sql`(${chantiers.nom} LIKE ${'%' + search + '%'} OR ${chantiers.adresse} LIKE ${'%' + search + '%'})`,
    )
  }

  if (statut) {
    conditions.push(eq(chantiers.statut, statut))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db.select().from(chantiers).where(where).orderBy(chantiers.nom)
})
