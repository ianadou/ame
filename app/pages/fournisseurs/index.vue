<script setup lang="ts">
import { Plus, Upload, Download } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { fournisseurs, loading, fetchFournisseurs, createFournisseur } = useFournisseurs()

const search = ref('')
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showExportModal = ref(false)
const importEntites = [{ value: 'fournisseurs', label: 'Fournisseurs' }]

async function loadFournisseurs() {
  await fetchFournisseurs(search.value || undefined)
}

const debouncedSearch = useDebounceFn(loadFournisseurs, 300)

watch(search, debouncedSearch)

async function handleCreate(data: Record<string, unknown>) {
  await createFournisseur(data)
  showCreateModal.value = false
  await loadFournisseurs()
}

await loadFournisseurs()
</script>

<template>
  <div class="space-y-4">
    <!-- Filters bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="w-full sm:w-72">
        <AppSearchInput v-model="search" placeholder="Rechercher par nom, téléphone ou email..." />
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
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody v-if="!loading && fournisseurs.length > 0">
            <tr
              v-for="fournisseur in fournisseurs"
              :key="fournisseur.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/fournisseurs/${fournisseur.id}`)"
            >
              <td class="font-medium">{{ fournisseur.nom }}</td>
              <td class="mono text-[12.5px] text-muted">{{ fournisseur.telephone ?? '—' }}</td>
              <td class="mono text-[12.5px] text-ink-3">{{ fournisseur.email ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="3" />

      <AppEmptyState
        v-if="!loading && fournisseurs.length === 0"
        title="Aucun fournisseur"
        description="Commencez par ajouter votre premier fournisseur."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Ajouter un fournisseur
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <!-- Create modal -->
    <AppModal v-model:open="showCreateModal" title="Nouveau fournisseur">
      <FournisseurForm @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </FournisseurForm>
    </AppModal>

    <ImportDialog
      v-model:open="showImportModal"
      :entites="importEntites"
      @done="loadFournisseurs"
    />
    <ExportDialog v-model:open="showExportModal" :entites="importEntites" />
  </div>
</template>
