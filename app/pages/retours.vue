<script setup lang="ts">
import { Undo2 } from 'lucide-vue-next'
import type { MaterielDehors } from '~/composables/useRetours'
import type { Chantier } from '~/composables/useChantiers'
import type { Beneficiaire } from '~/composables/useBeneficiaires'

const { materiel, loading, fetchMaterielDehors } = useRetours()

const chantierFilter = ref('')
const beneficiaireFilter = ref('')

const { data: chantiersResp } = await useFetch<Chantier[]>('/api/chantiers')
const { data: beneficiairesResp } = await useFetch<Beneficiaire[]>('/api/beneficiaires')

const chantierOptions = computed(() => [
  { value: '', label: 'Tous les chantiers' },
  ...(chantiersResp.value ?? []).map((c) => ({ value: c.id, label: c.nom })),
])
const beneficiaireOptions = computed(() => [
  { value: '', label: 'Tous les bénéficiaires' },
  ...(beneficiairesResp.value ?? []).map((b) => ({ value: b.id, label: b.nom })),
])

async function load() {
  await fetchMaterielDehors({
    chantierId: chantierFilter.value || undefined,
    beneficiaireId: beneficiaireFilter.value || undefined,
  })
}

watch([chantierFilter, beneficiaireFilter], load)

const ligneActive = ref<MaterielDehors | null>(null)
const showRetourModal = ref(false)

function ouvrirRetour(ligne: MaterielDehors) {
  ligneActive.value = ligne
  showRetourModal.value = true
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

await load()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <p class="flex-1 text-[13px] text-muted">Matériel retournable sorti et pas encore rendu.</p>
      <div class="flex flex-col gap-3 sm:flex-row">
        <AppSelect v-model="chantierFilter" :options="chantierOptions" />
        <AppSelect v-model="beneficiaireFilter" :options="beneficiaireOptions" />
      </div>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Article</th>
              <th class="text-right">À rendre</th>
              <th>Chantier</th>
              <th>Bénéficiaire</th>
              <th>Bon</th>
              <th>Sorti le</th>
              <th />
            </tr>
          </thead>
          <tbody v-if="!loading && materiel.length > 0">
            <tr v-for="ligne in materiel" :key="ligne.ligneSortieId" class="row-hover">
              <td>
                <span class="font-medium text-ink">{{ ligne.articleNom }}</span>
                <span class="ml-2 text-[12px] text-muted">{{ ligne.articleReference }}</span>
              </td>
              <td class="mono num text-right text-ink-2">
                {{ ligne.restant }} {{ ligne.unite }}
                <span v-if="ligne.quantiteRetournee > 0" class="text-[11.5px] text-muted">
                  / {{ ligne.quantite }}
                </span>
              </td>
              <td class="text-muted">{{ ligne.chantierNom ?? '—' }}</td>
              <td class="text-muted">{{ ligne.beneficiaireNom ?? '—' }}</td>
              <td>
                <NuxtLink
                  :to="`/sorties/${ligne.sortieId}`"
                  class="mono text-[12.5px] text-ink-3 hover:text-ink"
                >
                  {{ ligne.reference }}
                </NuxtLink>
              </td>
              <td class="mono text-[12.5px] text-muted">{{ formatDate(ligne.dateSortie) }}</td>
              <td class="text-right">
                <AppButton variant="secondary" size="sm" @click="ouvrirRetour(ligne)">
                  <Undo2 class="h-3.5 w-3.5" />
                  Marquer rendu
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="7" />

      <AppEmptyState
        v-if="!loading && materiel.length === 0"
        title="Rien dehors"
        description="Tout le matériel retournable est rentré. Les articles marqués « retournable » sur un bon apparaissent ici jusqu'à leur retour."
      />
    </AppCard>

    <RetourModal v-model:open="showRetourModal" :ligne="ligneActive" @saved="load" />
  </div>
</template>
