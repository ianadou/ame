export interface MaterielDehors {
  ligneSortieId: string
  sortieId: string
  reference: string
  dateSortie: string | null
  articleId: string
  articleReference: string
  articleNom: string
  unite: string
  quantite: number
  quantiteRetournee: number
  restant: number
  chantierId: string | null
  chantierNom: string | null
  beneficiaireId: string | null
  beneficiaireNom: string | null
}

export interface RetourEnregistre {
  id: string
  quantite: number
  dateRetour: string
  etat: 'bon' | 'endommage'
  notes: string | null
  articleNom: string
  articleReference: string
  unite: string
  sortieId: string
  reference: string
  chantierId: string | null
  chantierNom: string | null
  beneficiaireId: string | null
  beneficiaireNom: string | null
}

interface RetourFilters {
  chantierId?: string
  beneficiaireId?: string
}

function versParams(filters: RetourFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.chantierId) params.set('chantierId', filters.chantierId)
  if (filters.beneficiaireId) params.set('beneficiaireId', filters.beneficiaireId)
  return params
}

export function useRetours() {
  const materiel = ref<MaterielDehors[]>([])
  const historique = ref<RetourEnregistre[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMaterielDehors(filters: RetourFilters = {}) {
    loading.value = true
    error.value = null

    try {
      materiel.value = await $fetch<MaterielDehors[]>(`/api/retours?${versParams(filters)}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function fetchHistorique(filters: RetourFilters = {}) {
    loading.value = true
    error.value = null

    try {
      historique.value = await $fetch<RetourEnregistre[]>(
        `/api/retours/historique?${versParams(filters)}`,
      )
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function enregistrerRetour(data: Record<string, unknown>) {
    return await $fetch('/api/retours', { method: 'POST', body: data })
  }

  return {
    materiel,
    historique,
    loading,
    error,
    fetchMaterielDehors,
    fetchHistorique,
    enregistrerRetour,
  }
}
