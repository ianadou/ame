export interface Client {
  id: string
  nom: string
  type: string
  telephone: string | null
  email: string | null
  adresse: string | null
  ville: string | null
  notes: string | null
  createdAt: string
}

interface ClientFilters {
  search?: string
  type?: string
}

export function useClients() {
  const clients = ref<Client[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchClients(filters: ClientFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.type) params.set('type', filters.type)
      clients.value = await $fetch<Client[]>(`/api/clients?${params}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createClient(data: Record<string, unknown>) {
    return await $fetch<Client>('/api/clients', { method: 'POST', body: data })
  }

  async function updateClient(id: string, data: Record<string, unknown>) {
    await $fetch(`/api/clients/${id}`, { method: 'PUT', body: data })
  }

  async function deleteClient(id: string) {
    await $fetch(`/api/clients/${id}`, { method: 'DELETE' })
  }

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  }
}
