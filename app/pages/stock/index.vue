<script setup lang="ts">
import { Plus, Upload, Download } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { articles, total, loading, fetchArticles, createArticle } = useStock()

const search = ref('')
const categorieFilter = ref('')
const alerteOnly = ref(false)
const voirArchives = ref(false)
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
    inclureArchives: voirArchives.value || undefined,
    page: currentPage.value,
  })
}

const debouncedSearch = useDebounceFn(loadArticles, 300)

watch(search, () => {
  currentPage.value = 1
  debouncedSearch()
})

watch([categorieFilter, alerteOnly, voirArchives], () => {
  currentPage.value = 1
  loadArticles()
})

watch(currentPage, loadArticles)

async function handleCreate(data: Record<string, unknown>) {
  await createArticle(data)
  showCreateModal.value = false
  await loadArticles()
}

function stockStatus(a: { stockActuel: number; seuilAlerte: number }) {
  if (a.stockActuel <= a.seuilAlerte) return 'danger'
  if (a.stockActuel <= a.seuilAlerte * 1.4) return 'warning'
  return 'success'
}

function stockLabel(a: { stockActuel: number; seuilAlerte: number }) {
  if (a.stockActuel <= a.seuilAlerte) return 'Bas'
  if (a.stockActuel <= a.seuilAlerte * 1.4) return 'Limite'
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
        <AppButton
          :variant="voirArchives ? 'secondary' : 'ghost'"
          size="sm"
          @click="voirArchives = !voirArchives"
        >
          {{ voirArchives ? 'Masquer archivés' : 'Voir archivés' }}
        </AppButton>
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
        <table class="data-table">
          <thead>
            <tr>
              <th class="w-[120px]">Réf.</th>
              <th class="w-[420px]">Nom</th>
              <th class="w-[220px] !pl-8">Catégorie</th>
              <th class="w-[100px] !text-right">Stock</th>
              <th class="w-[120px] !pl-12">Unité</th>
              <th class="w-[140px] !pl-6">Statut</th>
            </tr>
          </thead>
          <tbody v-if="!loading && articles.length > 0">
            <tr
              v-for="article in articles"
              :key="article.id"
              class="row-hover cursor-pointer"
              :class="article.statut === 'archive' ? 'opacity-60' : ''"
              @click="navigateTo(`/stock/${article.id}`)"
            >
              <td class="mono font-medium text-ink-2">
                <div class="flex items-center gap-2">
                  <span>{{ article.reference }}</span>
                  <AppBadge v-if="article.statut === 'archive'" variant="danger" solid>
                    Archivé
                  </AppBadge>
                </div>
              </td>
              <td class="truncate font-medium">
                {{ article.nom }}
                <!-- La nature de l'article commande tout le suivi des retours ;
                     elle n'était visible sur aucun écran de lecture. -->
                <span
                  v-if="article.type === 'equipement'"
                  class="ml-2 whitespace-nowrap rounded-full bg-paper-2 px-2 py-px text-[10.5px] text-ink-3"
                >
                  Équipement{{ article.retournable ? ' · à rendre' : '' }}
                </span>
              </td>
              <td class="!pl-8 text-muted">{{ article.categorieNom ?? '' }}</td>
              <td
                class="mono num text-right text-[14px] font-semibold"
                :class="{
                  'text-rust-dark': article.statut === 'actif' && stockStatus(article) === 'danger',
                  'text-ochre-dark':
                    article.statut === 'actif' && stockStatus(article) === 'warning',
                }"
              >
                {{ article.stockActuel }}
              </td>
              <td class="!pl-12 text-muted">{{ article.unite }}</td>
              <td class="!pl-6">
                <AppBadge v-if="article.statut === 'actif'" :variant="stockStatus(article)" solid>
                  {{ stockLabel(article) }}
                </AppBadge>
                <AppBadge v-else variant="neutral">Archivé</AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="6" />

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
