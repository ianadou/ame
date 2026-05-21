import { eq } from 'drizzle-orm'
import { db } from '../db'
import { parametres } from '../db/schema'

export default defineEventHandler(async () => {
  const [row] = await db.select().from(parametres).where(eq(parametres.id, 'app'))
  return {
    nomEntreprise: row?.nomEntreprise ?? null,
  }
})
