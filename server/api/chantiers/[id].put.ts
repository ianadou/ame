import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers } from '../../db/schema'
import { updateChantierSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updateChantierSchema.parse)

  const [existing] = await db.select().from(chantiers).where(eq(chantiers.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Chantier introuvable' })
  }

  await db
    .update(chantiers)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(chantiers.id, id))

  return { ...existing, ...body }
})
