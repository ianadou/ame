import { db } from '../../db'
import { beneficiaires } from '../../db/schema'
import { createBeneficiaireSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createBeneficiaireSchema.parse)

  const beneficiaire = {
    id: generateId(),
    ...body,
  }

  await db.insert(beneficiaires).values(beneficiaire)
  setResponseStatus(event, 201)
  return beneficiaire
})
