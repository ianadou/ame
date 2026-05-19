export interface CommandeListItem {
  id: string
  reference: string
  fournisseurId: string
  fournisseurNom: string | null
  statut: string
  dateCommande: string | null
  dateLivraisonPrevue: string | null
  createdAt: string
  total: number
}

interface CommandeFilters {
  statut?: string
  fournisseur?: string
}

export function useCommandes() {
  const commandes = ref<CommandeListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCommandes(filters: CommandeFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.statut) params.set('statut', filters.statut)
      if (filters.fournisseur) params.set('fournisseur', filters.fournisseur)
      commandes.value = await $fetch<CommandeListItem[]>(`/api/commandes?${params}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createCommande(data: Record<string, unknown>) {
    await $fetch('/api/commandes', { method: 'POST', body: data })
  }

  async function updateCommande(id: string, data: Record<string, unknown>) {
    await $fetch(`/api/commandes/${id}`, { method: 'PUT', body: data })
  }

  async function deleteCommande(id: string) {
    await $fetch(`/api/commandes/${id}`, { method: 'DELETE' })
  }

  return {
    commandes,
    loading,
    error,
    fetchCommandes,
    createCommande,
    updateCommande,
    deleteCommande,
  }
}
