import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { sorties, clients, chantiers } from '../../db/schema'

/**
 * Bons actifs dont le solde n'est pas rentré. Triés par échéance, les
 * dépassées d'abord : c'est l'ordre dans lequel on passe ses appels de
 * relance. `joursRetard` est négatif pour une échéance à venir, nul ou
 * positif une fois la date passée.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const seulementRetard = query.retard === '1' || query.retard === 'true'
  const clientId = query.clientId as string | undefined

  const reste = sql<number>`${sorties.montantTotal} - ${sorties.montantPaye}`
  const joursRetard = sql<number>`cast(julianday('now') - julianday(${sorties.dateEcheance}) as integer)`

  const conditions = [eq(sorties.statut, 'actif'), sql`${reste} > 0.5`]
  if (clientId) conditions.push(eq(sorties.clientId, clientId))
  if (seulementRetard) {
    conditions.push(
      sql`${sorties.dateEcheance} IS NOT NULL AND date(${sorties.dateEcheance}) < date('now')`,
    )
  }

  return (
    db
      .select({
        id: sorties.id,
        reference: sorties.reference,
        dateSortie: sorties.dateSortie,
        dateEcheance: sorties.dateEcheance,
        objet: sorties.objet,
        montantTotal: sorties.montantTotal,
        montantPaye: sorties.montantPaye,
        reste,
        statutPaiement: sorties.statutPaiement,
        modeReglement: sorties.modeReglement,
        clientId: sorties.clientId,
        clientNom: clients.nom,
        clientTelephone: clients.telephone,
        chantierNom: chantiers.nom,
        joursRetard,
      })
      .from(sorties)
      .innerJoin(clients, eq(sorties.clientId, clients.id))
      .leftJoin(chantiers, eq(sorties.chantierId, chantiers.id))
      .where(and(...conditions))
      // Les bons sans échéance passent en dernier : rien ne les rend urgents.
      .orderBy(sql`${sorties.dateEcheance} IS NULL`, sorties.dateEcheance, sorties.dateSortie)
  )
})
