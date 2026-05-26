import { sql } from 'drizzle-orm'
import { db } from '../../db'
import { fournisseurs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''

  const where = search
    ? sql`(${fournisseurs.nom} LIKE ${'%' + search + '%'} OR ${fournisseurs.telephone} LIKE ${'%' + search + '%'} OR ${fournisseurs.email} LIKE ${'%' + search + '%'})`
    : undefined

  return db.select().from(fournisseurs).where(where).orderBy(fournisseurs.nom)
})
