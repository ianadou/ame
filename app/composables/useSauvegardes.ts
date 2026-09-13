export type MotifSauvegarde =
  | 'quotidienne'
  | 'manuelle'
  | 'avant-mise-a-jour'
  | 'avant-effacement'
  | 'avant-restauration'

export interface Sauvegarde {
  nom: string
  creeLe: string
  taille: number
  motif: MotifSauvegarde
}

export interface EtatSauvegardes {
  // Faux pour une base distante : elle n'a pas de fichier sur cet ordinateur.
  disponible: boolean
  dossier: string | null
  sauvegardes: Sauvegarde[]
}

export function useSauvegardes() {
  const etat = ref<EtatSauvegardes>({ disponible: true, dossier: null, sauvegardes: [] })
  const loading = ref(false)

  async function charger() {
    loading.value = true
    try {
      etat.value = await $fetch<EtatSauvegardes>('/api/sauvegardes')
    } finally {
      loading.value = false
    }
  }

  async function sauvegarder() {
    return await $fetch<Sauvegarde>('/api/sauvegardes', { method: 'POST' })
  }

  async function restaurer(nom: string) {
    await $fetch(`/api/sauvegardes/${encodeURIComponent(nom)}/restaurer`, { method: 'POST' })
  }

  async function ouvrirDossier() {
    await $fetch('/api/sauvegardes/ouvrir', { method: 'POST' })
  }

  return { etat, loading, charger, sauvegarder, restaurer, ouvrirDossier }
}
