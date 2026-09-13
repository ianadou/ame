// Ce que le client doit sur un bon. Un taux de TVA figé à l'émission rend le
// montant stocké HT : le dû est alors TTC. Sans taux, montant et dû se confondent.
// Encaissements, statut et créances se mesurent tous contre ce montant.
export function montantDu(montantTotal: number, tauxTva: number | null): number {
  return tauxTva == null ? montantTotal : montantTotal * (1 + tauxTva / 100)
}
