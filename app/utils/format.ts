// Formateurs partagés. Ils vivaient en copies locales dans 12 pages, ce qui
// avait fait diverger l'affichage : la liste des chantiers rendait
// « 2026-07-15 » là où la fiche du même chantier rendait « 15/07/2026 ».

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const DATE_HEURE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const NOMBRE = new Intl.NumberFormat('fr-FR')

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return DATE.format(new Date(iso))
}

// SQLite rend « 2026-08-16 21:54:58 » : sans le T, Safari et Firefox
// refusent la chaîne.
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return DATE_HEURE.format(new Date(iso.includes('T') ? iso : iso.replace(' ', 'T')))
}

// Forme longue réservée aux modales de détail, où la date est l'information
// principale et non une colonne à scanner.
const DATE_LONGUE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateLongue(iso: string | null | undefined): string {
  if (!iso) return ''
  return DATE_LONGUE.format(new Date(iso.includes('T') ? iso : iso.replace(' ', 'T')))
}

export function fcfa(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  return NOMBRE.format(Math.round(n)) + ' FCFA'
}

// « 1 sortie » / « 2 sorties » — le pluriel muet faisait écrire « 1 sorties »
// sur le dashboard et « 12 sac » sur la fiche article.
export function pluriel(n: number, singulier: string, plurielForme?: string): string {
  return n > 1 ? (plurielForme ?? `${singulier}s`) : singulier
}
