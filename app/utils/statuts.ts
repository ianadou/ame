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

// Conditions convenues à l'émission du bon, pas l'instrument de paiement.
const CONDITIONS: Record<string, string> = {
  comptant: 'Comptant',
  credit: 'Crédit',
}

// Canal par lequel l'argent est effectivement rentré, distinct de
// `sorties.conditionsReglement` qui porte les conditions convenues au moment
// de l'émission. Les opérateurs mobile money de Côte d'Ivoire viennent en
// premier : c'est par là que passe l'essentiel des encaissements.
const MODE_ENCAISSEMENT: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  moov_money: 'Moov Money',
  wave: 'Wave',
  especes: 'Espèces',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  // Héritage : règlements saisis avant que les opérateurs soient distingués.
  mobile_money: 'Mobile money',
}

// `mobile_money` n'est plus proposé à la saisie : il ne dit pas sur quel
// compte l'argent est arrivé.
export const OPTIONS_MODE_ENCAISSEMENT = Object.entries(MODE_ENCAISSEMENT)
  .filter(([value]) => value !== 'mobile_money')
  .map(([value, label]) => ({ value, label }))

// Un identifiant de transaction n'a de sens que pour un canal qui en émet un.
export function attendUneReference(mode: string): boolean {
  return ['orange_money', 'mtn_momo', 'moov_money', 'wave', 'virement'].includes(mode)
}

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

export function libelleConditions(conditions: string): string {
  return CONDITIONS[conditions] ?? conditions
}
