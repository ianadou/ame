import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { fournisseurs } from '../../db/schema'
import { updateFournisseurSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateFournisseurSchema.parse)

  const [existing] = await db.select().from(fournisseurs).where(eq(fournisseurs.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Fournisseur introuvable' })
  }

  await db.update(fournisseurs).set(body).where(eq(fournisseurs.id, id))

  return { ...existing, ...body }
})
