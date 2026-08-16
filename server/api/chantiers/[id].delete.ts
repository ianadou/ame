import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers, sorties } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(chantiers).where(eq(chantiers.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Chantier introuvable' })
  }

  // Des bons pointent le chantier : supprimer effacerait la destination du
  // matériel déjà sorti. On propose plutôt de le passer en « Terminé ».
  const [{ nbBons } = { nbBons: 0 }] = await db
    .select({ nbBons: sql<number>`count(*)` })
    .from(sorties)
    .where(eq(sorties.chantierId, id))

  if (nbBons > 0) {
    throw createError({
      statusCode: 409,
      message: `Ce chantier a ${nbBons} bon(s) rattaché(s). Passez-le en « Terminé » plutôt que de le supprimer.`,
    })
  }

  await db.delete(chantiers).where(eq(chantiers.id, id))

  return { success: true }
})
