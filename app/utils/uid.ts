// Compteur de portée module : chaque appel rend un identifiant unique pour
// la durée de vie de la page. Sert à relier un élément à son libellé
// (aria-labelledby) quand plusieurs instances d'un même composant coexistent.
const compteurs = new Map<string, number>()

export function nextId(prefixe: string): string {
  const n = (compteurs.get(prefixe) ?? 0) + 1
  compteurs.set(prefixe, n)
  return `${prefixe}-${n}`
}
