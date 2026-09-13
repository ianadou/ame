import { sql } from 'drizzle-orm'
import { sorties } from '../db/schema'

// Pendant SQL de `montantDu` (shared/utils/montants.ts), pour filtrer et
// additionner les créances en base plutôt qu'en mémoire.
export const montantDuSql = sql<number>`(${sorties.montantTotal} * (1 + coalesce(${sorties.tauxTvaApplique}, 0) / 100.0))`

export const resteDuSql = sql<number>`(${montantDuSql} - ${sorties.montantPaye})`
