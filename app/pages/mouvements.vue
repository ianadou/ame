<script setup lang="ts">
import { Plus, Minus } from 'lucide-vue-next'

interface Mouvement {
  id: string
  type: string
  quantite: number
  bonLivraison: string | null
  motif: string | null
  createdAt: string
  articleReference: string
  articleNom: string
  fournisseurNom: string | null
  clientNom: string | null
  sortieId: string | null
  sortieReference: string | null
}

interface MouvementsResponse {
  data: Mouvement[]
  total: number
  page: number
  limit: number
}

const typeFilter = ref('')
const dateDebut = ref('')
const dateFin = ref('')
const currentPage = ref(1)
const showEntreeModal = ref(false)
const selectedMvtId = ref<string | null>(null)

const typeOptions = [
  { value: 'entree', label: 'Approvisionnements' },
  { value: 'sortie', label: 'Ventes' },
  { value: 'ajustement_positif', label: 'Ajustements +' },
  { value: 'ajustement_negatif', label: 'Ajustements −' },
]

function mvtMeta(type: string): {
  label: string
  variant: 'success' | 'danger' | 'neutral' | 'info'
} {
  if (type === 'entree') return { label: 'Approvisionnement', variant: 'success' }
  if (type === 'sortie') return { label: 'Vente', variant: 'neutral' }
  if (type === 'ajustement_positif') return { label: 'Ajustement +', variant: 'info' }
  if (type === 'ajustement_negatif') return { label: 'Ajustement −', variant: 'info' }
  return { label: type, variant: 'neutral' }
}
function mvtSigne(type: string) {
  return type === 'sortie' || type === 'ajustement_negatif' ? '−' : '+'
}

const queryParams = computed(() => ({
  type: typeFilter.value || undefined,
  dateDebut: dateDebut.value || undefined,
  dateFin: dateFin.value || undefined,
  page: currentPage.value,
  limit: 20,
}))

const { data: result, refresh } = await useFetch<MouvementsResponse>('/api/mouvements', {
  query: queryParams,
})

const mouvements = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / 20))

watch([typeFilter, dateDebut, dateFin], () => {
  currentPage.value = 1
})

async function handleMouvement(data: Record<string, unknown>) {
  await $fetch('/api/mouvements', { method: 'POST', body: data })
  showEntreeModal.value = false
  await refresh()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filters bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <AppSelect v-model="typeFilter" :options="typeOptions" placeholder="Tous types" />
        <AppInput v-model="dateDebut" label="" type="date" placeholder="Date début" />
        <AppInput v-model="dateFin" label="" type="date" placeholder="Date fin" />
      </div>
      <div class="flex gap-2">
        <AppButton @click="showEntreeModal = true">
          <Plus class="h-4 w-4" />
          Entrée
        </AppButton>
        <AppButton variant="secondary" @click="navigateTo('/sorties/nouveau')">
          <Minus class="h-4 w-4" />
          Bon de vente
        </AppButton>
      </div>
    </div>

    <!-- Table -->
    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table v-if="mouvements.length > 0" class="data-table">
          <thead>
            <tr>
              <th class="w-[120px]">Date</th>
              <th class="w-[100px]">Type</th>
              <th>Article</th>
              <th class="text-center">Qté</th>
              <th>Fournisseur / Client</th>
              <th>Bon</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="mvt in mouvements"
              :key="mvt.id"
              class="row-hover cursor-pointer"
              @click="selectedMvtId = mvt.id"
            >
              <td class="mono text-[12px] text-ink-3">{{ formatDate(mvt.createdAt) }}</td>
              <td>
                <AppBadge :variant="mvtMeta(mvt.type).variant">
                  {{ mvtMeta(mvt.type).label }}
                </AppBadge>
              </td>
              <td>
                <span class="mono font-medium text-ink-2">{{ mvt.articleReference }}</span>
                · {{ mvt.articleNom }}
              </td>
              <td class="mono num text-center text-[14px] font-semibold">
                {{ mvtSigne(mvt.type) }}{{ mvt.quantite }}
              </td>
              <td class="text-ink-2">{{ mvt.fournisseurNom || mvt.clientNom || '' }}</td>
              <td class="mono text-[12px] text-muted">
                <NuxtLink
                  v-if="mvt.sortieId"
                  :to="`/sorties/${mvt.sortieId}`"
                  class="hover:text-ink"
                  @click.stop
                >
                  {{ mvt.sortieReference }}
                </NuxtLink>
                <span v-else>{{ mvt.bonLivraison || '' }}</span>
              </td>
              <td class="text-[12.5px] text-muted">{{ mvt.motif || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="mouvements.length === 0"
        title="Aucune transaction"
        description="Les transactions de stock apparaîtront ici."
      />

      <!-- Pagination -->
      <div
        v-if="total > 20"
        class="flex items-center justify-between border-t border-slate-200 px-4 py-3"
      >
        <p class="text-sm text-slate-500">
          {{ (currentPage - 1) * 20 + 1 }} à {{ Math.min(currentPage * 20, total) }} sur {{ total }}
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

    <!-- Mouvement modals -->
    <AppModal v-model:open="showEntreeModal" title="Nouvelle approvisionnement">
      <MouvementForm @submit="handleMouvement">
        <template #actions>
          <AppButton variant="secondary" @click="showEntreeModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider l'entrée</AppButton>
        </template>
      </MouvementForm>
    </AppModal>

    <MouvementDetailModal :id="selectedMvtId" @close="selectedMvtId = null" />
  </div>
</template>
