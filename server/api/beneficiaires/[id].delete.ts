import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { beneficiaires, sorties } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(beneficiaires).where(eq(beneficiaires.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
  }

  // Des bons enregistrent qui a retiré le matériel : on ne casse pas cette
  // traçabilité. Un ancien membre se désactive (actif = false).
  const [{ nbBons } = { nbBons: 0 }] = await db
    .select({ nbBons: sql<number>`count(*)` })
    .from(sorties)
    .where(eq(sorties.beneficiaireId, id))

  if (nbBons > 0) {
    throw createError({
      statusCode: 409,
      message: `Ce bénéficiaire figure sur ${nbBons} bon(s). Désactivez-le plutôt que de le supprimer.`,
    })
  }

  await db.delete(beneficiaires).where(eq(beneficiaires.id, id))

  return { success: true }
})
