export interface Chantier {
  id: string
  nom: string
  ville: string | null
  adresse: string | null
  statut: 'en_cours' | 'termine' | 'pause'
  clientId: string | null
  clientNom: string | null
  budgetAlloue: number | null
  dateDebut: string | null
  dateFinPrevue: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface ChantierFilters {
  search?: string
  statut?: string
}

export function useChantiers() {
  const chantiers = ref<Chantier[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchChantiers(filters: ChantierFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.statut) params.set('statut', filters.statut)
      chantiers.value = await $fetch<Chantier[]>(`/api/chantiers?${params}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createChantier(data: Record<string, unknown>) {
    return await $fetch<Chantier>('/api/chantiers', { method: 'POST', body: data })
  }

  async function updateChantier(id: string, data: Record<string, unknown>) {
    await $fetch(`/api/chantiers/${id}`, { method: 'PUT', body: data })
  }

  async function deleteChantier(id: string) {
    await $fetch(`/api/chantiers/${id}`, { method: 'DELETE' })
  }

  return {
    chantiers,
    loading,
    error,
    fetchChantiers,
    createChantier,
    updateChantier,
    deleteChantier,
  }
}
