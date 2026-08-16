interface ArticleFilters {
  search?: string
  categorie?: string
  alerte?: boolean
  inclureArchives?: boolean
  page?: number
  limit?: number
}

interface ArticleListItem {
  id: string
  reference: string
  nom: string
  categorieId: string | null
  categorieNom: string | null
  unite: string
  prixUnitaire: number | null
  stockActuel: number
  seuilAlerte: number
  emplacement: string | null
  type: 'consommable' | 'equipement'
  retournable: boolean
  statut: 'actif' | 'archive'
}

interface ArticlesResponse {
  data: ArticleListItem[]
  total: number
  page: number
  limit: number
}

export function useStock() {
  const articles = ref<ArticleListItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchArticles(filters: ArticleFilters = {}) {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.categorie) params.set('categorie', filters.categorie)
      if (filters.alerte) params.set('alerte', 'true')
      if (filters.inclureArchives) params.set('inclureArchives', '1')
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))

      const response = await $fetch<ArticlesResponse>(`/api/articles?${params}`)
      articles.value = response.data
      total.value = response.total
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createArticle(data: Record<string, unknown>) {
    await $fetch('/api/articles', { method: 'POST', body: data })
  }

  async function updateArticle(id: string, data: Record<string, unknown>) {
    await $fetch(`/api/articles/${id}`, { method: 'PUT', body: data })
  }

  async function archiverArticle(id: string, motif: string) {
    await $fetch(`/api/articles/${id}/archiver`, { method: 'POST', body: { motif } })
  }

  async function restaurerArticle(id: string) {
    await $fetch(`/api/articles/${id}/restaurer`, { method: 'POST' })
  }

  async function ajusterStock(id: string, stockPhysique: number, motif: string) {
    return await $fetch<{ delta: number; stockApres: number }>(`/api/articles/${id}/ajustement`, {
      method: 'POST',
      body: { stockPhysique, motif },
    })
  }

  return {
    articles,
    total,
    loading,
    error,
    fetchArticles,
    createArticle,
    updateArticle,
    archiverArticle,
    restaurerArticle,
    ajusterStock,
  }
}
