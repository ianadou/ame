<script setup lang="ts">
import { Plus, UserCheck } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { beneficiaires, loading, fetchBeneficiaires, createBeneficiaire } = useBeneficiaires()
const notifications = useNotifications()

const search = ref('')
const actifFilter = ref<'' | '1' | '0'>('')
const showCreateModal = ref(false)

const actifOptions = [
  { value: '', label: 'Tous' },
  { value: '1', label: 'Actifs' },
  { value: '0', label: 'Inactifs' },
]

async function loadBeneficiaires() {
  await fetchBeneficiaires({
    search: search.value || undefined,
    actif: actifFilter.value || undefined,
  })
}

const debouncedSearch = useDebounceFn(loadBeneficiaires, 300)
watch(search, debouncedSearch)
watch(actifFilter, loadBeneficiaires)

async function handleCreate(data: Record<string, unknown>) {
  try {
    await createBeneficiaire(data)
    showCreateModal.value = false
    notifications.success('Bénéficiaire créé', String(data.nom))
    await loadBeneficiaires()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Création impossible')
        : 'Création impossible'
    notifications.danger('Création impossible', msg)
  }
}

await loadBeneficiaires()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <div class="w-full sm:w-64">
          <AppSearchInput v-model="search" placeholder="Rechercher nom, fonction..." />
        </div>
        <AppSelect v-model="actifFilter" :options="actifOptions" />
      </div>
      <AppButton @click="showCreateModal = true">
        <Plus class="h-4 w-4" />
        Ajouter
      </AppButton>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table v-if="!loading && beneficiaires.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Fonction</th>
              <th>Téléphone</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in beneficiaires"
              :key="b.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/beneficiaires/${b.id}`)"
            >
              <td class="font-medium">{{ b.nom }}</td>
              <td class="text-muted">{{ b.fonction ?? '' }}</td>
              <td class="mono text-[12.5px] text-muted">{{ b.telephone ?? '' }}</td>
              <td>
                <AppBadge :variant="metaActif(b.actif).variant">
                  {{ metaActif(b.actif).label }}
                </AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="4" />

      <AppEmptyState
        v-if="!loading && beneficiaires.length === 0"
        :icon="UserCheck"
        title="Aucun bénéficiaire"
        description="Ajoutez le personnel qui retire du matériel pour les chantiers."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Ajouter un bénéficiaire
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <AppModal v-model:open="showCreateModal" title="Nouveau bénéficiaire">
      <BeneficiaireForm @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </BeneficiaireForm>
    </AppModal>
  </div>
</template>
