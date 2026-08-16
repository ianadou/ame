import { eq, sql, and } from 'drizzle-orm'
import { db } from '../../db'
import { beneficiaires } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const actif = query.actif as string | undefined

  const conditions = []

  if (search) {
    const like = '%' + search + '%'
    conditions.push(
      sql`(${beneficiaires.nom} LIKE ${like} OR ${beneficiaires.fonction} LIKE ${like})`,
    )
  }

  if (actif === '1' || actif === 'true') conditions.push(eq(beneficiaires.actif, true))
  if (actif === '0' || actif === 'false') conditions.push(eq(beneficiaires.actif, false))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db.select().from(beneficiaires).where(where).orderBy(beneficiaires.nom)
})
