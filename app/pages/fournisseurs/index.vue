<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { fournisseurs, loading, fetchFournisseurs, createFournisseur } = useFournisseurs()

const search = ref('')
const showCreateModal = ref(false)

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
        <AppSearchInput v-model="search" placeholder="Rechercher par nom, contact ou email..." />
      </div>
      <AppButton @click="showCreateModal = true">
        <Plus class="h-4 w-4" />
        Ajouter
      </AppButton>
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
                Contact
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Téléphone
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Email
              </th>
            </tr>
          </thead>
          <tbody v-if="!loading && fournisseurs.length > 0">
            <tr
              v-for="fournisseur in fournisseurs"
              :key="fournisseur.id"
              class="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
              @click="navigateTo(`/fournisseurs/${fournisseur.id}`)"
            >
              <td class="px-4 py-3 text-sm font-medium text-slate-900">{{ fournisseur.nom }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ fournisseur.contact ?? '—' }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ fournisseur.telephone ?? '—' }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ fournisseur.email ?? '—' }}</td>
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
  </div>
</template>
