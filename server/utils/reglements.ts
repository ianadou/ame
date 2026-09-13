import { eq, sql } from 'drizzle-orm'
import type { db } from '../db'
import { sorties, reglements } from '../db/schema'
import { montantDu } from '../../shared/utils/montants'

// Le type de transaction Drizzle, déduit du callback de `db.transaction`.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Recalcule `montantPaye` et `statutPaiement` d'un bon depuis ses règlements.
 *
 * Le statut n'est plus déclaratif : il découle de ce qui a réellement été
 * encaissé. Un bon ne peut donc plus afficher « Payé » sans trace en face,
 * ni rester « Impayé » alors que l'argent est rentré. Le seuil est le dû du
 * bon : TTC dès qu'un taux de TVA y a été figé.
 *
 * Les deux colonnes restent stockées sur `sorties` plutôt que calculées à la
 * lecture : la liste des ventes, la fiche client et la fiche chantier les
 * lisent déjà telles quelles, et une jointure d'agrégat sur chacune coûterait
 * plus cher que ce recalcul, qui n'arrive qu'à l'écriture.
 *
 * À appeler dans la transaction qui vient de toucher les règlements.
 */
export async function recalculerPaiement(
  tx: Tx,
  sortieId: string,
): Promise<{ montantPaye: number; statutPaiement: string }> {
  const [totaux] = await tx
    .select({
      montantTotal: sorties.montantTotal,
      tauxTvaApplique: sorties.tauxTvaApplique,
      encaisse: sql<number>`coalesce((
        select sum(${reglements.montant}) from ${reglements}
        where ${reglements.sortieId} = ${sortieId}
      ), 0)`,
    })
    .from(sorties)
    .where(eq(sorties.id, sortieId))

  if (!totaux) {
    throw createError({ statusCode: 404, message: 'Bon introuvable' })
  }

  const montantPaye = totaux.encaisse
  const du = montantDu(totaux.montantTotal, totaux.tauxTvaApplique)
  const statutPaiement = montantPaye <= 0 ? 'impaye' : montantPaye + 0.5 >= du ? 'paye' : 'partiel'

  await tx.update(sorties).set({ montantPaye, statutPaiement }).where(eq(sorties.id, sortieId))

  return { montantPaye, statutPaiement }
}
