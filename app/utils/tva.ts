export interface DetailTva {
  taux: number
  ht: number
  montantTva: number
  ttc: number
}

// Un bon émis sous régime assujetti porte un taux figé : son montant stocké
// est alors du HT. Sans taux, le montant est net et aucune TVA ne s'affiche.
export function detailTva(montantHt: number, taux: number | null): DetailTva | null {
  if (taux == null) return null
  const montantTva = montantHt * (taux / 100)
  return { taux, ht: montantHt, montantTva, ttc: montantHt + montantTva }
}
