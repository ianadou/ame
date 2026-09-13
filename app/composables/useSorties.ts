import type { Reglement } from './useCreances'

export interface SortieListe {
  id: string
  reference: string
  clientId: string
  clientNom: string
  dateSortie: string | null
  objet: string | null
  montantTotal: number
  montantPaye: number
  conditionsReglement: string
  statutPaiement: string
  statut: 'actif' | 'annule'
  createdAt: string
  nbArticles: number
}

export interface LigneSortieInput {
  articleId: string
  quantite: number
}

export interface LigneSortieDetail {
  id: string
  articleId: string
  articleReference: string
  articleNom: string
  unite: string
  retournable: boolean
  quantite: number
  prixUnitaire: number
  stockApres: number
  quantiteRetournee: number
}

export interface SortieDetail {
  id: string
  reference: string
  clientId: string
  clientNom: string
  clientTelephone: string | null
  clientVille: string | null
  chantierId: string | null
  chantierNom: string | null
  beneficiaireId: string | null
  beneficiaireNom: string | null
  beneficiaireFonction: string | null
  dateSortie: string | null
  dateEcheance: string | null
  objet: string | null
  montantTotal: number
  montantPaye: number
  conditionsReglement: string
  statutPaiement: string
  notes: string | null
  statut: 'actif' | 'annule'
  annuleLe: string | null
  motifAnnulation: string | null
  tauxTvaApplique: number | null
  createdAt: string
  lignes: LigneSortieDetail[]
  reglements: Reglement[]
}

export function useSorties() {
  const sorties = ref<SortieListe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSorties(filters: { search?: string; statutPaiement?: string } = {}) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.statutPaiement) params.set('statutPaiement', filters.statutPaiement)
      sorties.value = await $fetch<SortieListe[]>(`/api/sorties?${params}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createSortie(data: Record<string, unknown>) {
    return await $fetch<{ id: string; reference: string }>('/api/sorties', {
      method: 'POST',
      body: data,
    })
  }

  async function annulerSortie(id: string, motif: string) {
    await $fetch(`/api/sorties/${id}/annuler`, {
      method: 'POST',
      body: { motif },
    })
  }

  return { sorties, loading, error, fetchSorties, createSortie, annulerSortie }
}
