import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { parametres } from '../db/schema'
import { updateParametresSchema } from '../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, updateParametresSchema.parse)

  const [existing] = await db.select().from(parametres).where(eq(parametres.id, 'app'))
  if (existing) {
    await db
      .update(parametres)
      .set({ ...body, updatedAt: sql`(datetime('now'))` })
      .where(eq(parametres.id, 'app'))
  } else {
    await db.insert(parametres).values({ id: 'app', ...body })
  }

  return body
})
