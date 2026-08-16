export interface Creance {
  id: string
  reference: string
  dateSortie: string | null
  dateEcheance: string | null
  objet: string | null
  montantTotal: number
  montantPaye: number
  reste: number
  statutPaiement: string
  modeReglement: string
  clientId: string
  clientNom: string
  clientTelephone: string | null
  chantierNom: string | null
  // Positif si l'échéance est dépassée, négatif si elle est à venir,
  // null quand aucune échéance n'a été fixée.
  joursRetard: number | null
}

export interface Reglement {
  id: string
  montant: number
  dateReglement: string
  mode: string
  notes: string | null
}

export function useCreances() {
  const creances = ref<Creance[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCreances(filters: { retard?: boolean; clientId?: string } = {}) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.retard) params.set('retard', '1')
      if (filters.clientId) params.set('clientId', filters.clientId)
      creances.value = await $fetch<Creance[]>(`/api/creances?${params}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function enregistrerReglement(sortieId: string, data: Record<string, unknown>) {
    return await $fetch(`/api/sorties/${sortieId}/reglements`, { method: 'POST', body: data })
  }

  async function supprimerReglement(id: string) {
    await $fetch(`/api/reglements/${id}`, { method: 'DELETE' })
  }

  return { creances, loading, error, fetchCreances, enregistrerReglement, supprimerReglement }
}
