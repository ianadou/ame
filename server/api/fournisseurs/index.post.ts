import { db } from '../../db'
import { fournisseurs } from '../../db/schema'
import { createFournisseurSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createFournisseurSchema.parse)

  const fournisseur = {
    id: generateId(),
    ...body,
  }

  await db.insert(fournisseurs).values(fournisseur)
  setResponseStatus(event, 201)
  return fournisseur
})
