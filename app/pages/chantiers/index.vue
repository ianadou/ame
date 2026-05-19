<script setup lang="ts">
import { Plus, Upload, Download } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { chantiers, loading, fetchChantiers, createChantier } = useChantiers()

const search = ref('')
const statutFilter = ref('')
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showExportModal = ref(false)
const importEntites = [{ value: 'chantiers', label: 'Chantiers' }]

const statutOptions = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'en_pause', label: 'En pause' },
]

const statutMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  en_cours: { label: 'En cours', variant: 'success' },
  termine: { label: 'Terminé', variant: 'neutral' },
  en_pause: { label: 'En pause', variant: 'warning' },
}

async function loadChantiers() {
  await fetchChantiers({
    search: search.value || undefined,
    statut: statutFilter.value || undefined,
  })
}

const debouncedSearch = useDebounceFn(loadChantiers, 300)

watch(search, debouncedSearch)
watch(statutFilter, loadChantiers)

async function handleCreate(data: Record<string, unknown>) {
  await createChantier(data)
  showCreateModal.value = false
  await loadChantiers()
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

await loadChantiers()
</script>

<template>
  <div class="space-y-4">
    <!-- Filters bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <div class="w-full sm:w-64">
          <AppSearchInput v-model="search" placeholder="Rechercher par nom ou adresse..." />
        </div>
        <AppSelect v-model="statutFilter" :options="statutOptions" placeholder="Tous les statuts" />
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
                Nom
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Adresse
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Statut
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Début
              </th>
            </tr>
          </thead>
          <tbody v-if="!loading && chantiers.length > 0">
            <tr
              v-for="chantier in chantiers"
              :key="chantier.id"
              class="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
              @click="navigateTo(`/chantiers/${chantier.id}`)"
            >
              <td class="px-4 py-3 text-sm font-medium text-slate-900">{{ chantier.nom }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ chantier.adresse ?? '—' }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="statutMeta[chantier.statut]?.variant ?? 'neutral'">
                  {{ statutMeta[chantier.statut]?.label ?? chantier.statut }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ formatDate(chantier.dateDebut) }}</td>
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
        v-if="!loading && chantiers.length === 0"
        title="Aucun chantier"
        description="Commencez par créer votre premier chantier."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Ajouter un chantier
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <!-- Create modal -->
    <AppModal v-model:open="showCreateModal" title="Nouveau chantier">
      <ChantierForm @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </ChantierForm>
    </AppModal>

    <ImportDialog v-model:open="showImportModal" :entites="importEntites" @done="loadChantiers" />
  </div>
</template>
