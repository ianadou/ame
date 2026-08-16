import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { beneficiaires } from '../../db/schema'
import { updateBeneficiaireSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateBeneficiaireSchema.parse)

  const [existing] = await db.select().from(beneficiaires).where(eq(beneficiaires.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
  }

  await db.update(beneficiaires).set(body).where(eq(beneficiaires.id, id))

  return { ...existing, ...body }
})
