import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { sorties, lignesSortie, articles, mouvements } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [existing] = await db.select().from(sorties).where(eq(sorties.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Bon de sortie introuvable' })
  }

  const lignes = await db.select().from(lignesSortie).where(eq(lignesSortie.sortieId, id))

  // Annuler un bon de sortie restitue le stock (entrée inverse) et purge
  // les mouvements générés, pour que le journal reste cohérent.
  await db.transaction(async (tx) => {
    for (const ligne of lignes) {
      await tx
        .update(articles)
        .set({
          stockActuel: sql`${articles.stockActuel} + ${ligne.quantite}`,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(articles.id, ligne.articleId))
    }
    await tx.delete(mouvements).where(eq(mouvements.sortieId, id))
    await tx.delete(lignesSortie).where(eq(lignesSortie.sortieId, id))
    await tx.delete(sorties).where(eq(sorties.id, id))
  })

  return { success: true }
})
