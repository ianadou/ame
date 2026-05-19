<script setup lang="ts">
import { Plus, Upload, Download } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { articles, total, loading, fetchArticles, createArticle } = useStock()

const search = ref('')
const categorieFilter = ref('')
const alerteOnly = ref(false)
const currentPage = ref(1)
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showExportModal = ref(false)

const importEntites = [
  { value: 'articles', label: 'Articles' },
  { value: 'categories', label: 'Catégories' },
]

const { data: categories } = await useFetch<{ id: string; nom: string }[]>('/api/categories')

const categoryFilterOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map((c) => ({ value: c.id, label: c.nom }))
})

const totalPages = computed(() => Math.ceil(total.value / 20))

async function loadArticles() {
  await fetchArticles({
    search: search.value || undefined,
    categorie: categorieFilter.value || undefined,
    alerte: alerteOnly.value || undefined,
    page: currentPage.value,
  })
}

const debouncedSearch = useDebounceFn(loadArticles, 300)

watch(search, () => {
  currentPage.value = 1
  debouncedSearch()
})

watch([categorieFilter, alerteOnly], () => {
  currentPage.value = 1
  loadArticles()
})

watch(currentPage, loadArticles)

async function handleCreate(data: Record<string, unknown>) {
  await createArticle(data)
  showCreateModal.value = false
  await loadArticles()
}

function stockStatus(article: { stockActuel: number; seuilAlerte: number }) {
  if (article.stockActuel === 0) return 'danger'
  if (article.stockActuel <= article.seuilAlerte) return 'warning'
  return 'success'
}

function stockLabel(article: { stockActuel: number; seuilAlerte: number }) {
  if (article.stockActuel === 0) return 'Rupture'
  if (article.stockActuel <= article.seuilAlerte) return 'Stock bas'
  return 'En stock'
}

await loadArticles()

const notifications = useNotifications()
onMounted(async () => {
  try {
    const a = await $fetch<unknown[]>('/api/alertes')
    if (a.length > 0) {
      notifications.warning(
        `${a.length} article${a.length > 1 ? 's' : ''} en alerte de stock bas`,
        'Réapprovisionnement conseillé.',
      )
    }
  } catch {
    /* silencieux */
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filters bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <div class="w-full sm:w-64">
          <AppSearchInput v-model="search" placeholder="Rechercher par nom ou ref..." />
        </div>
        <AppSelect
          v-model="categorieFilter"
          :options="categoryFilterOptions"
          placeholder="Toutes catégories"
        />
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="alerteOnly" type="checkbox" class="rounded border-slate-300" />
          Alertes uniquement
        </label>
      </div>
      <div class="flex gap-2">
        <AppButton variant="secondary" @click="showExportModal = true">
          <Download class="h-4 w-4" />
          Exporter
        </AppButton>
        <AppButton variant="secondary" @click="showImportModal = true">
          <Upload class="h-4 w-4" />
          Importer
        </AppButton>
        <AppButton @click="showCreateModal = true">
          <Plus class="h-4 w-4" />
          Ajouter
        </AppButton>
      </div>
    </div>

    <!-- Table -->
    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Référence
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Nom
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Catégorie
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Stock
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Unité
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Statut
              </th>
            </tr>
          </thead>
          <tbody v-if="!loading && articles.length > 0">
            <tr
              v-for="article in articles"
              :key="article.id"
              class="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
              @click="navigateTo(`/stock/${article.id}`)"
            >
              <td class="px-4 py-3 text-sm font-medium text-slate-900">{{ article.reference }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ article.nom }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ article.categorieNom ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">
                {{ article.stockActuel }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ article.unite }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="stockStatus(article)">{{ stockLabel(article) }}</AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"
        />
      </div>

      <AppEmptyState
        v-if="!loading && articles.length === 0"
        title="Aucun article"
        description="Commencez par ajouter votre premier article au stock."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Ajouter un article
          </AppButton>
        </template>
      </AppEmptyState>

      <!-- Pagination -->
      <div
        v-if="total > 20"
        class="flex items-center justify-between border-t border-slate-200 px-4 py-3"
      >
        <p class="text-sm text-slate-500">
          {{ (currentPage - 1) * 20 + 1 }}–{{ Math.min(currentPage * 20, total) }} sur {{ total }}
        </p>
        <div class="flex gap-2">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Précédent
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Suivant
          </AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Create modal -->
    <AppModal v-model:open="showCreateModal" title="Nouvel article">
      <ArticleForm @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </ArticleForm>
    </AppModal>

    <!-- Import / Export -->
    <ImportDialog v-model:open="showImportModal" :entites="importEntites" @done="loadArticles" />
    <ExportDialog v-model:open="showExportModal" :entites="importEntites" />
  </div>
</template>
