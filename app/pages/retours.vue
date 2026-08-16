<script setup lang="ts">
import { Undo2 } from 'lucide-vue-next'
import type { MaterielDehors } from '~/composables/useRetours'
import type { Chantier } from '~/composables/useChantiers'
import type { Beneficiaire } from '~/composables/useBeneficiaires'

const { materiel, historique, loading, fetchMaterielDehors, fetchHistorique } = useRetours()

// Deux questions distinctes : « qu'est-ce qui est encore dehors ? » (vue du
// magasinier au quotidien) et « qu'est-ce qui est revenu, dans quel état ? »
// (bilan de fin de chantier). La seconde n'était lisible nulle part.
const vue = ref<'dehors' | 'historique'>('dehors')

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
  const filtres = {
    chantierId: chantierFilter.value || undefined,
    beneficiaireId: beneficiaireFilter.value || undefined,
  }
  await (vue.value === 'dehors' ? fetchMaterielDehors(filtres) : fetchHistorique(filtres))
}

watch([chantierFilter, beneficiaireFilter, vue], load)

const ligneActive = ref<MaterielDehors | null>(null)
const showRetourModal = ref(false)

function ouvrirRetour(ligne: MaterielDehors) {
  ligneActive.value = ligne
  showRetourModal.value = true
}

const totalDehors = computed(() => materiel.value.reduce((s, l) => s + l.restant, 0))

await load()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="flex rounded-md border border-line bg-white p-0.5">
        <button
          v-for="onglet in [
            { cle: 'dehors', label: 'Encore dehors' },
            { cle: 'historique', label: 'Retours enregistrés' },
          ]"
          :key="onglet.cle"
          class="rounded px-3 py-1.5 text-[12.5px] transition-colors"
          :class="
            vue === onglet.cle ? 'bg-paper-2 font-medium text-ink' : 'text-ink-3 hover:text-ink'
          "
          @click="vue = onglet.cle as 'dehors' | 'historique'"
        >
          {{ onglet.label }}
        </button>
      </div>

      <p v-if="vue === 'dehors' && totalDehors > 0" class="flex-1 text-[13px] text-muted">
        {{ totalDehors }} unité{{ totalDehors > 1 ? 's' : '' }} de matériel chez les équipes.
      </p>
      <div v-else class="flex-1" />

      <div class="flex flex-col gap-3 sm:flex-row">
        <AppSelect v-model="chantierFilter" :options="chantierOptions" />
        <AppSelect v-model="beneficiaireFilter" :options="beneficiaireOptions" />
      </div>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table v-if="vue === 'dehors'" class="data-table">
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

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Article</th>
              <th class="text-right">Rendu</th>
              <th>État</th>
              <th>Chantier</th>
              <th>Bénéficiaire</th>
              <th>Bon</th>
              <th>Rendu le</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody v-if="!loading && historique.length > 0">
            <tr v-for="r in historique" :key="r.id" class="row-hover">
              <td>
                <span class="font-medium text-ink">{{ r.articleNom }}</span>
                <span class="ml-2 text-[12px] text-muted">{{ r.articleReference }}</span>
              </td>
              <td class="mono num text-right text-ink-2">{{ r.quantite }} {{ r.unite }}</td>
              <td>
                <AppBadge :variant="r.etat === 'bon' ? 'success' : 'danger'" solid>
                  {{ r.etat === 'bon' ? 'Bon état' : 'Endommagé' }}
                </AppBadge>
              </td>
              <td class="text-muted">{{ r.chantierNom ?? '—' }}</td>
              <td class="text-muted">{{ r.beneficiaireNom ?? '—' }}</td>
              <td>
                <NuxtLink
                  :to="`/sorties/${r.sortieId}`"
                  class="mono text-[12.5px] text-ink-3 hover:text-ink"
                >
                  {{ r.reference }}
                </NuxtLink>
              </td>
              <td class="mono text-[12.5px] text-muted">{{ formatDate(r.dateRetour) }}</td>
              <td class="text-[12.5px] text-muted">{{ r.notes ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="vue === 'dehors' ? 7 : 8" />

      <AppEmptyState
        v-if="!loading && vue === 'dehors' && materiel.length === 0"
        title="Aucun matériel dehors"
        description="Tout l'équipement retournable est rentré. Un article marqué « retournable » sorti sur un bon apparaît ici jusqu'à son retour."
      />
      <AppEmptyState
        v-if="!loading && vue === 'historique' && historique.length === 0"
        title="Aucun retour enregistré"
        description="Les retours saisis depuis cette page, une fiche chantier ou une fiche bénéficiaire s'inscrivent ici avec leur état."
      />
    </AppCard>

    <RetourModal v-model:open="showRetourModal" :ligne="ligneActive" @saved="load" />
  </div>
</template>
