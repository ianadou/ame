import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { beneficiaires } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(beneficiaires).where(eq(beneficiaires.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
  }

  // Note : étape 2 ajoutera une FK depuis sorties.beneficiaire_id ; on
  // bloquera la suppression si transactions associées. Pour l'instant
  // table isolée → suppression libre.
  await db.delete(beneficiaires).where(eq(beneficiaires.id, id))

  return { success: true }
})
