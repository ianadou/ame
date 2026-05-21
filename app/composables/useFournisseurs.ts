export interface Fournisseur {
  id: string
  nom: string
  telephone: string | null
  email: string | null
  adresse: string | null
  notes: string | null
  createdAt: string
}

export function useFournisseurs() {
  const fournisseurs = ref<Fournisseur[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFournisseurs(search?: string) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      fournisseurs.value = await $fetch<Fournisseur[]>(`/api/fournisseurs?${params}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createFournisseur(data: Record<string, unknown>) {
    await $fetch('/api/fournisseurs', { method: 'POST', body: data })
  }

  async function updateFournisseur(id: string, data: Record<string, unknown>) {
    await $fetch(`/api/fournisseurs/${id}`, { method: 'PUT', body: data })
  }

  async function deleteFournisseur(id: string) {
    await $fetch(`/api/fournisseurs/${id}`, { method: 'DELETE' })
  }

  return {
    fournisseurs,
    loading,
    error,
    fetchFournisseurs,
    createFournisseur,
    updateFournisseur,
    deleteFournisseur,
  }
}
