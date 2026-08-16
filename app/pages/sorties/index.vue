<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { sorties, loading, fetchSorties } = useSorties()

const search = ref('')
const statutFilter = ref('')

const statutOptions = [
  { value: 'paye', label: 'Payé' },
  { value: 'partiel', label: 'Partiel' },
  { value: 'impaye', label: 'Impayé' },
]

async function load() {
  await fetchSorties({
    search: search.value || undefined,
    statutPaiement: statutFilter.value || undefined,
  })
}

const debouncedSearch = useDebounceFn(load, 300)
watch(search, debouncedSearch)
watch(statutFilter, load)

await load()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <div class="w-full sm:w-64">
          <AppSearchInput v-model="search" placeholder="Rechercher réf, client, objet..." />
        </div>
        <AppSelect
          v-model="statutFilter"
          :options="statutOptions"
          placeholder="Tous les paiements"
        />
      </div>
      <AppButton @click="navigateTo('/sorties/nouveau')">
        <Plus class="h-4 w-4" />
        Nouvelle vente
      </AppButton>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Date</th>
              <th class="text-center">Articles</th>
              <th class="text-center">Montant</th>
              <th>Règlement</th>
              <th>Paiement</th>
            </tr>
          </thead>
          <tbody v-if="!loading && sorties.length > 0">
            <tr
              v-for="s in sorties"
              :key="s.id"
              class="row-hover cursor-pointer"
              :class="s.statut === 'annule' ? 'opacity-60' : ''"
              @click="navigateTo(`/sorties/${s.id}`)"
            >
              <td class="font-medium">
                <div class="flex items-center gap-2">
                  <span>{{ s.reference }}</span>
                  <AppBadge v-if="s.statut === 'annule'" variant="danger" solid>Annulée</AppBadge>
                </div>
              </td>
              <td>{{ s.clientNom }}</td>
              <td class="mono text-[12.5px] text-muted">{{ formatDate(s.dateSortie) }}</td>
              <td class="text-center text-muted">{{ s.nbArticles }}</td>
              <td class="text-center font-medium text-ink">{{ fcfa(s.montantTotal) }}</td>
              <td class="text-muted">{{ libelleReglement(s.modeReglement) }}</td>
              <td>
                <AppBadge :variant="metaPaiement(s.statutPaiement).variant" solid>
                  {{ metaPaiement(s.statutPaiement).label }}
                </AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="7" />

      <AppEmptyState
        v-if="!loading && sorties.length === 0"
        title="Aucune vente"
        description="Créez un bon de vente pour livrer des articles à un client."
      >
        <template #action>
          <AppButton @click="navigateTo('/sorties/nouveau')">
            <Plus class="h-4 w-4" />
            Nouvelle vente
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>
  </div>
</template>
