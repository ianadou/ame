import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { chantiers, clients, sorties, beneficiaires } from '../../db/schema'

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

  // Consommation = montant des bons actifs affectés au chantier. Les bons
  // annulés sont exclus : leur stock a été restitué, ils ne pèsent pas sur
  // le budget.
  const bonsActifs = and(eq(sorties.chantierId, id), eq(sorties.statut, 'actif'))

  const bons = await db
    .select({
      id: sorties.id,
      reference: sorties.reference,
      dateSortie: sorties.dateSortie,
      objet: sorties.objet,
      montantTotal: sorties.montantTotal,
      statutPaiement: sorties.statutPaiement,
      beneficiaireNom: beneficiaires.nom,
    })
    .from(sorties)
    .leftJoin(beneficiaires, eq(sorties.beneficiaireId, beneficiaires.id))
    .where(bonsActifs)
    .orderBy(desc(sorties.dateSortie), desc(sorties.createdAt))

  const [totaux] = await db
    .select({ consomme: sql<number>`coalesce(sum(${sorties.montantTotal}), 0)` })
    .from(sorties)
    .where(bonsActifs)

  return { ...chantier, consomme: totaux?.consomme ?? 0, bons }
})
