export interface Beneficiaire {
  id: string
  nom: string
  fonction: string | null
  telephone: string | null
  actif: boolean
  createdAt: string
}

interface BeneficiaireFilters {
  search?: string
  actif?: '1' | '0'
}

export function useBeneficiaires() {
  const beneficiaires = ref<Beneficiaire[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBeneficiaires(filters: BeneficiaireFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.actif) params.set('actif', filters.actif)
      beneficiaires.value = await $fetch<Beneficiaire[]>(`/api/beneficiaires?${params}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createBeneficiaire(data: Record<string, unknown>) {
    return await $fetch<Beneficiaire>('/api/beneficiaires', { method: 'POST', body: data })
  }

  async function updateBeneficiaire(id: string, data: Record<string, unknown>) {
    await $fetch(`/api/beneficiaires/${id}`, { method: 'PUT', body: data })
  }

  async function deleteBeneficiaire(id: string) {
    await $fetch(`/api/beneficiaires/${id}`, { method: 'DELETE' })
  }

  return {
    beneficiaires,
    loading,
    error,
    fetchBeneficiaires,
    createBeneficiaire,
    updateBeneficiaire,
    deleteBeneficiaire,
  }
}
