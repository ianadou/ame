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
  chantierNom: string | null
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
const showSortieModal = ref(false)

const typeOptions = [
  { value: 'entree', label: 'Entrées' },
  { value: 'sortie', label: 'Sorties' },
]

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
  showSortieModal.value = false
  await refresh()
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
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
        <AppButton variant="secondary" @click="showSortieModal = true">
          <Minus class="h-4 w-4" />
          Sortie
        </AppButton>
      </div>
    </div>

    <!-- Table -->
    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table v-if="mouvements.length > 0" class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Article</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Quantité</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fournisseur / Chantier</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Bon livraison</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Motif</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="mvt in mouvements"
              :key="mvt.id"
              class="border-b border-slate-100"
            >
              <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(mvt.createdAt) }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="mvt.type === 'entree' ? 'success' : 'danger'">
                  {{ mvt.type === 'entree' ? 'Entrée' : 'Sortie' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700">
                <span class="font-medium text-slate-900">{{ mvt.articleReference }}</span>
                — {{ mvt.articleNom }}
              </td>
              <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">{{ mvt.quantite }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ mvt.fournisseurNom || mvt.chantierNom || '—' }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ mvt.bonLivraison || '—' }}</td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ mvt.motif || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppEmptyState
        v-if="mouvements.length === 0"
        title="Aucun mouvement"
        description="Les mouvements de stock apparaîtront ici."
      />

      <!-- Pagination -->
      <div
        v-if="total > 20"
        class="flex items-center justify-between border-t border-slate-200 px-4 py-3"
      >
        <p class="text-sm text-slate-500">
          {{ (currentPage - 1) * 20 + 1 }}–{{ Math.min(currentPage * 20, total) }} sur {{ total }}
        </p>
        <div class="flex gap-2">
          <AppButton variant="secondary" size="sm" :disabled="currentPage <= 1" @click="currentPage--">
            Précédent
          </AppButton>
          <AppButton variant="secondary" size="sm" :disabled="currentPage >= totalPages" @click="currentPage++">
            Suivant
          </AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Mouvement modals -->
    <AppModal v-model:open="showEntreeModal" title="Nouvelle entrée de stock">
      <MouvementForm type="entree" @submit="handleMouvement">
        <template #actions>
          <AppButton variant="secondary" @click="showEntreeModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider l'entrée</AppButton>
        </template>
      </MouvementForm>
    </AppModal>

    <AppModal v-model:open="showSortieModal" title="Nouvelle sortie de stock">
      <MouvementForm type="sortie" @submit="handleMouvement">
        <template #actions>
          <AppButton variant="secondary" @click="showSortieModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider la sortie</AppButton>
        </template>
      </MouvementForm>
    </AppModal>
  </div>
</template>
