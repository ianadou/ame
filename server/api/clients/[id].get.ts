import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../../db'
import { clients, sorties, lignesSortie } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [client] = await db.select().from(clients).where(eq(clients.id, id))

  if (!client) {
    throw createError({ statusCode: 404, message: 'Client introuvable' })
  }

  // Historique des bons de sortie du client, avec nb d'articles par bon.
  const historique = await db
    .select({
      id: sorties.id,
      reference: sorties.reference,
      dateSortie: sorties.dateSortie,
      montantTotal: sorties.montantTotal,
      statutPaiement: sorties.statutPaiement,
      objet: sorties.objet,
      createdAt: sorties.createdAt,
      nbArticles: sql<number>`count(${lignesSortie.id})`,
    })
    .from(sorties)
    .leftJoin(lignesSortie, eq(lignesSortie.sortieId, sorties.id))
    .where(eq(sorties.clientId, id))
    .groupBy(sorties.id)
    .orderBy(desc(sorties.createdAt))

  const [totaux] = await db
    .select({
      nbSorties: sql<number>`count(*)`,
      totalAchete: sql<number>`coalesce(sum(${sorties.montantTotal}), 0)`,
      totalImpaye: sql<number>`coalesce(sum(${sorties.montantTotal} - ${sorties.montantPaye}), 0)`,
    })
    .from(sorties)
    .where(eq(sorties.clientId, id))

  return { ...client, sorties: historique, totaux }
})
