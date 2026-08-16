import { db } from '../../db'
import { chantiers } from '../../db/schema'
import { createChantierSchema } from '../../utils/validation'
import { generateId } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createChantierSchema.parse)

  const chantier = {
    id: generateId(),
    ...body,
  }

  await db.insert(chantiers).values(chantier)
  setResponseStatus(event, 201)
  return chantier
})
