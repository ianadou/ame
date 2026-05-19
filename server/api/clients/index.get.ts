import { eq, sql, and } from 'drizzle-orm'
import { db } from '../../db'
import { clients } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const type = query.type as string | undefined

  const conditions = []

  if (search) {
    const like = '%' + search + '%'
    conditions.push(
      sql`(${clients.nom} LIKE ${like} OR ${clients.contact} LIKE ${like} OR ${clients.telephone} LIKE ${like} OR ${clients.ville} LIKE ${like})`,
    )
  }

  if (type) {
    conditions.push(eq(clients.type, type))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db.select().from(clients).where(where).orderBy(clients.nom)
})
