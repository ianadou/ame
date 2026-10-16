<script setup lang="ts">
import { Plus, PackagePlus } from 'lucide-vue-next'

interface Entree {
  id: string
  quantite: number
  bonLivraison: string | null
  motif: string | null
  createdAt: string
  articleReference: string
  articleNom: string
  fournisseurNom: string | null
}

interface EntreesResponse {
  data: Entree[]
  total: number
}

const LIMITE = 20

const notifications = useNotifications()
const { fournisseurs, fetchFournisseurs } = useFournisseurs()

const fournisseurFilter = ref('')
const dateDebut = ref('')
const dateFin = ref('')
const currentPage = ref(1)
const showEntreeModal = ref(false)
const selectedMvtId = ref<string | null>(null)

const queryParams = computed(() => ({
  type: 'entree',
  fournisseur: fournisseurFilter.value || undefined,
  dateDebut: dateDebut.value || undefined,
  dateFin: dateFin.value || undefined,
  page: currentPage.value,
  limit: LIMITE,
}))

const {
  data: result,
  status,
  refresh,
} = await useFetch<EntreesResponse>('/api/mouvements', { query: queryParams })

const entrees = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / LIMITE))
const loading = computed(() => status.value === 'pending' && entrees.value.length === 0)

const fournisseurOptions = computed(() =>
  fournisseurs.value.map((f) => ({ value: f.id, label: f.nom })),
)

watch([fournisseurFilter, dateDebut, dateFin], () => {
  currentPage.value = 1
})

await fetchFournisseurs()

async function handleEntree(data: Record<string, unknown>) {
  try {
    await $fetch('/api/mouvements', { method: 'POST', body: data })
    showEntreeModal.value = false
    await refresh()
    notifications.success('Entrée enregistrée', `${formatQuantite(data.quantite as number)} unités`)
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Entrée refusée')
        : 'Entrée refusée'
    notifications.danger('Entrée refusée', msg)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <AppSelect
          v-model="fournisseurFilter"
          :options="fournisseurOptions"
          placeholder="Tous les fournisseurs"
        />
        <AppInput v-model="dateDebut" label="" type="date" placeholder="Date début" />
        <AppInput v-model="dateFin" label="" type="date" placeholder="Date fin" />
      </div>
      <AppButton @click="showEntreeModal = true">
        <Plus class="h-4 w-4" />
        Nouvelle entrée
      </AppButton>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table v-if="!loading && entrees.length > 0" class="data-table">
          <thead>
            <tr>
              <th class="w-[120px]">Date</th>
              <th>Article</th>
              <th class="text-center">Qté</th>
              <th>Fournisseur</th>
              <th>Bon de livraison</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entree in entrees"
              :key="entree.id"
              class="row-hover cursor-pointer"
              @click="selectedMvtId = entree.id"
            >
              <td class="mono text-[12px] text-ink-3">{{ formatDate(entree.createdAt) }}</td>
              <td>
                <span class="mono font-medium text-ink-2">{{ entree.articleReference }}</span>
                · {{ entree.articleNom }}
              </td>
              <td class="mono num text-center text-[14px] font-semibold">
                +{{ formatQuantite(entree.quantite) }}
              </td>
              <td class="text-ink-2">{{ entree.fournisseurNom || '' }}</td>
              <td class="mono text-[12px] text-muted">{{ entree.bonLivraison || '' }}</td>
              <td class="text-[12.5px] text-muted">{{ entree.motif || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="6" />

      <AppEmptyState
        v-if="!loading && entrees.length === 0"
        :icon="PackagePlus"
        title="Aucune entrée"
        description="Les entrées de stock (réceptions fournisseur) apparaîtront ici."
      >
        <template #action>
          <AppButton @click="showEntreeModal = true">
            <Plus class="h-4 w-4" />
            Nouvelle entrée
          </AppButton>
        </template>
      </AppEmptyState>

      <div
        v-if="total > LIMITE"
        class="flex items-center justify-between border-t border-slate-200 px-4 py-3"
      >
        <p class="text-sm text-slate-500">
          {{ (currentPage - 1) * LIMITE + 1 }} à {{ Math.min(currentPage * LIMITE, total) }} sur
          {{ total }}
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

    <AppModal v-model:open="showEntreeModal" title="Nouvelle entrée">
      <MouvementForm @submit="handleEntree">
        <template #actions>
          <AppButton variant="secondary" @click="showEntreeModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider l'entrée</AppButton>
        </template>
      </MouvementForm>
    </AppModal>

    <MouvementDetailModal :id="selectedMvtId" @close="selectedMvtId = null" />
  </div>
</template>
