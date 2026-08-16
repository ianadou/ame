import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers, clients } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const [chantier] = await db
    .select({
      id: chantiers.id,
      nom: chantiers.nom,
      ville: chantiers.ville,
      adresse: chantiers.adresse,
      statut: chantiers.statut,
      clientId: chantiers.clientId,
      clientNom: clients.nom,
      budgetAlloue: chantiers.budgetAlloue,
      dateDebut: chantiers.dateDebut,
      dateFinPrevue: chantiers.dateFinPrevue,
      notes: chantiers.notes,
      createdAt: chantiers.createdAt,
      updatedAt: chantiers.updatedAt,
    })
    .from(chantiers)
    .leftJoin(clients, eq(clients.id, chantiers.clientId))
    .where(eq(chantiers.id, id))

  if (!chantier) {
    throw createError({ statusCode: 404, message: 'Chantier introuvable' })
  }

  return chantier
})
