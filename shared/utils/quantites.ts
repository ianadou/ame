// Les quantités acceptent des décimales (2,5 tonnes), limitées au millième :
// le kilo près suffit pour une tonne. Chaque calcul de stock est réarrondi,
// sinon l'arithmétique flottante dérive (0,7 - 0,3 - 0,4 donne un négatif
// infime que la contrainte « stock >= 0 » refuse).
export const DECIMALES_QUANTITE = 3

const FACTEUR = 10 ** DECIMALES_QUANTITE

export function arrondirQuantite(n: number): number {
  return Math.round(n * FACTEUR) / FACTEUR
}

export function respectePrecisionQuantite(n: number): boolean {
  return arrondirQuantite(n) === n
}

const NOMBRE_QUANTITE = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: DECIMALES_QUANTITE,
})

// « 2,5 » et non « 2.5 », sur les bons comme dans les messages d'erreur.
export function formatQuantite(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  return NOMBRE_QUANTITE.format(n)
}
