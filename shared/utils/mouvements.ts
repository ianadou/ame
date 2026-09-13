// Chaque type de transaction, son libellé et son effet sur le stock. Partagé
// entre l'app et le serveur : les copies locales avaient divergé, et retours
// comme annulations passaient pour des approvisionnements fournisseur.
export const TYPES_MOUVEMENT = {
  entree: { libelle: 'Approvisionnement', pluriel: 'Approvisionnements', entrant: true },
  sortie: { libelle: 'Vente', pluriel: 'Ventes', entrant: false },
  retour: { libelle: 'Retour', pluriel: 'Retours', entrant: true },
  annulation: { libelle: 'Annulation', pluriel: 'Annulations', entrant: true },
  ajustement_positif: { libelle: 'Ajustement +', pluriel: 'Ajustements +', entrant: true },
  ajustement_negatif: { libelle: 'Ajustement −', pluriel: 'Ajustements −', entrant: false },
} as const

export type TypeMouvement = keyof typeof TYPES_MOUVEMENT

export const LISTE_TYPES_MOUVEMENT = Object.keys(TYPES_MOUVEMENT) as TypeMouvement[]

export const TYPES_ENTRANTS = LISTE_TYPES_MOUVEMENT.filter((type) => TYPES_MOUVEMENT[type].entrant)

export function estTypeMouvement(valeur: unknown): valeur is TypeMouvement {
  return typeof valeur === 'string' && Object.hasOwn(TYPES_MOUVEMENT, valeur)
}

export function libelleMouvement(type: string): string {
  return estTypeMouvement(type) ? TYPES_MOUVEMENT[type].libelle : type
}

export function estEntrant(type: string): boolean {
  return estTypeMouvement(type) && TYPES_MOUVEMENT[type].entrant
}
