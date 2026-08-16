import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { beneficiaires } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [beneficiaire] = await db.select().from(beneficiaires).where(eq(beneficiaires.id, id))

  if (!beneficiaire) {
    throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
  }

  return beneficiaire
})
