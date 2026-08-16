<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { chantiers, loading, fetchChantiers, createChantier } = useChantiers()
const notifications = useNotifications()

const search = ref('')
const statutFilter = ref('')
const showCreateModal = ref(false)

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'pause', label: 'En pause' },
  { value: 'termine', label: 'Terminé' },
]

const statutMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  en_cours: { label: 'En cours', variant: 'success' },
  pause: { label: 'En pause', variant: 'warning' },
  termine: { label: 'Terminé', variant: 'neutral' },
}

function fcfa(n: number | null) {
  if (n === null) return ''
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
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
  try {
    await createChantier(data)
    showCreateModal.value = false
    notifications.success('Chantier créé', String(data.nom))
    await loadChantiers()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Création impossible')
        : 'Création impossible'
    notifications.danger('Création impossible', msg)
  }
}

await loadChantiers()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <div class="w-full sm:w-64">
          <AppSearchInput v-model="search" placeholder="Rechercher nom, ville..." />
        </div>
        <AppSelect v-model="statutFilter" :options="statutOptions" />
      </div>
      <AppButton @click="showCreateModal = true">
        <Plus class="h-4 w-4" />
        Ajouter
      </AppButton>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Statut</th>
              <th>Ville</th>
              <th>Client</th>
              <th class="text-right">Budget</th>
              <th>Début</th>
            </tr>
          </thead>
          <tbody v-if="!loading && chantiers.length > 0">
            <tr
              v-for="chantier in chantiers"
              :key="chantier.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/chantiers/${chantier.id}`)"
            >
              <td class="font-medium">{{ chantier.nom }}</td>
              <td>
                <AppBadge :variant="statutMeta[chantier.statut]?.variant ?? 'neutral'">
                  {{ statutMeta[chantier.statut]?.label ?? chantier.statut }}
                </AppBadge>
              </td>
              <td class="text-muted">{{ chantier.ville ?? '' }}</td>
              <td class="text-muted">{{ chantier.clientNom ?? 'Interne' }}</td>
              <td class="mono num text-right text-ink-3">{{ fcfa(chantier.budgetAlloue) }}</td>
              <td class="mono text-[12.5px] text-muted">{{ chantier.dateDebut ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="6" />

      <AppEmptyState
        v-if="!loading && chantiers.length === 0"
        title="Aucun chantier"
        description="Commencez par créer votre premier chantier (site interne ou chez un client)."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Ajouter un chantier
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <AppModal v-model:open="showCreateModal" title="Nouveau chantier">
      <ChantierForm @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </ChantierForm>
    </AppModal>
  </div>
</template>
