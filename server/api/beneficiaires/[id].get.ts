import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { beneficiaires, sorties, chantiers } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [beneficiaire] = await db.select().from(beneficiaires).where(eq(beneficiaires.id, id))

  if (!beneficiaire) {
    throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
  }

  // Historique des prises de matériel. Les bons annulés sont exclus : le
  // matériel n'est jamais parti.
  const bons = await db
    .select({
      id: sorties.id,
      reference: sorties.reference,
      dateSortie: sorties.dateSortie,
      objet: sorties.objet,
      montantTotal: sorties.montantTotal,
      chantierId: sorties.chantierId,
      chantierNom: chantiers.nom,
    })
    .from(sorties)
    .leftJoin(chantiers, eq(sorties.chantierId, chantiers.id))
    .where(and(eq(sorties.beneficiaireId, id), eq(sorties.statut, 'actif')))
    .orderBy(desc(sorties.dateSortie), desc(sorties.createdAt))

  return { ...beneficiaire, bons }
})
