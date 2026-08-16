<script setup lang="ts">
import { Plus, Upload, Download, Users } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { clients, loading, fetchClients, createClient } = useClients()
const notifications = useNotifications()

const search = ref('')
const typeFilter = ref('')
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showExportModal = ref(false)
const importEntites = [{ value: 'clients', label: 'Clients' }]

const typeOptions = [
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'particulier', label: 'Particulier' },
]

async function loadClients() {
  await fetchClients({
    search: search.value || undefined,
    type: typeFilter.value || undefined,
  })
}

const debouncedSearch = useDebounceFn(loadClients, 300)
watch(search, debouncedSearch)
watch(typeFilter, loadClients)

async function handleCreate(data: Record<string, unknown>) {
  await createClient(data)
  showCreateModal.value = false
  notifications.success('Client créé', String(data.nom))
  await loadClients()
}

await loadClients()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <div class="w-full sm:w-64">
          <AppSearchInput v-model="search" placeholder="Rechercher nom, téléphone, ville..." />
        </div>
        <AppSelect v-model="typeFilter" :options="typeOptions" placeholder="Tous les types" />
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

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table v-if="!loading && clients.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Téléphone</th>
              <th>Adresse</th>
              <th>Ville</th>
              <th>NCC</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="client in clients"
              :key="client.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/clients/${client.id}`)"
            >
              <td class="font-medium">{{ client.nom }}</td>
              <td>
                <!-- Catégorie, pas état : le vert « succès » n'a rien à dire
                     d'un client particulier. Neutre pour les deux. -->
                <AppBadge variant="neutral">
                  {{ client.type === 'entreprise' ? 'Entreprise' : 'Particulier' }}
                </AppBadge>
              </td>
              <td class="mono text-[12.5px] text-muted">{{ client.telephone ?? '' }}</td>
              <td class="text-muted">{{ client.adresse ?? '' }}</td>
              <td class="text-muted">{{ client.ville ?? '' }}</td>
              <td class="mono text-[12px] text-ink-3">{{ client.ncc ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="6" />

      <AppEmptyState
        v-if="!loading && clients.length === 0"
        :icon="Users"
        title="Aucun client"
        description="Commencez par créer votre premier client."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Ajouter un client
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <AppModal v-model:open="showCreateModal" title="Nouveau client">
      <ClientForm @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </ClientForm>
    </AppModal>

    <ImportDialog v-model:open="showImportModal" :entites="importEntites" @done="loadClients" />
    <ExportDialog v-model:open="showExportModal" :entites="importEntites" />
  </div>
</template>
