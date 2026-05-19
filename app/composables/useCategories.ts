export interface Categorie {
  id: string
  nom: string
  description: string | null
  parentId: string | null
  createdAt: string
  children?: Categorie[]
}

export function useCategories() {
  const categories = ref<Categorie[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategories() {
    loading.value = true
    error.value = null

    try {
      categories.value = await $fetch<Categorie[]>('/api/categories')
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  async function createCategorie(data: Record<string, unknown>) {
    return await $fetch<Categorie>('/api/categories', { method: 'POST', body: data })
  }

  async function updateCategorie(id: string, data: Record<string, unknown>) {
    await $fetch(`/api/categories/${id}`, { method: 'PUT', body: data })
  }

  async function deleteCategorie(id: string) {
    await $fetch(`/api/categories/${id}`, { method: 'DELETE' })
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategorie,
    updateCategorie,
    deleteCategorie,
  }
}
