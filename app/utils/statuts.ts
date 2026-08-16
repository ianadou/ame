// Vocabulaire de statut partagé. Chaque page redéfinissait sa propre table,
// et les sévérités avaient divergé : « Impayé » était rendu en neutre gris
// pendant que « Partiel » était en ambre, une facture impayée paraissait
// donc plus calme qu'une facture à moitié réglée.

export type VarianteBadge = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface MetaStatut {
  label: string
  variant: VarianteBadge
}

const PAIEMENT: Record<string, MetaStatut> = {
  paye: { label: 'Payé', variant: 'success' },
  partiel: { label: 'Partiel', variant: 'warning' },
  impaye: { label: 'Impayé', variant: 'danger' },
}

const CHANTIER: Record<string, MetaStatut> = {
  en_cours: { label: 'En cours', variant: 'success' },
  pause: { label: 'En pause', variant: 'warning' },
  termine: { label: 'Terminé', variant: 'neutral' },
}

const COMMANDE: Record<string, MetaStatut> = {
  brouillon: { label: 'Brouillon', variant: 'neutral' },
  envoyee: { label: 'Envoyée', variant: 'info' },
  partielle: { label: 'Partielle', variant: 'warning' },
  recue: { label: 'Reçue', variant: 'success' },
  annulee: { label: 'Annulée', variant: 'danger' },
}

const REGLEMENT: Record<string, string> = {
  comptant: 'Comptant',
  credit: 'Crédit',
  mobile_money: 'Mobile money',
}

// Canal par lequel l'argent est effectivement rentré, distinct de
// `sorties.modeReglement` qui porte les conditions convenues (comptant ou
// crédit) au moment de l'émission.
const MODE_ENCAISSEMENT: Record<string, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile money',
  virement: 'Virement',
  cheque: 'Chèque',
}

export const OPTIONS_MODE_ENCAISSEMENT = Object.entries(MODE_ENCAISSEMENT).map(
  ([value, label]) => ({ value, label }),
)

export function libelleEncaissement(mode: string): string {
  return MODE_ENCAISSEMENT[mode] ?? mode
}

function lire(table: Record<string, MetaStatut>, cle: string): MetaStatut {
  return table[cle] ?? { label: cle, variant: 'neutral' }
}

export function metaPaiement(statut: string): MetaStatut {
  return lire(PAIEMENT, statut)
}

export function metaChantier(statut: string): MetaStatut {
  return lire(CHANTIER, statut)
}

export function metaCommande(statut: string): MetaStatut {
  return lire(COMMANDE, statut)
}

export function metaActif(actif: boolean): MetaStatut {
  return actif ? { label: 'Actif', variant: 'success' } : { label: 'Inactif', variant: 'neutral' }
}

// « credit » s'affichait tel quel, sans accent, via un simple replace('_', ' ').
export function libelleReglement(mode: string): string {
  return REGLEMENT[mode] ?? mode
}
