<script setup lang="ts">
import { Wallet, Phone } from 'lucide-vue-next'
import type { Creance } from '~/composables/useCreances'

const { creances, loading, fetchCreances } = useCreances()

const seulementRetard = ref(false)

async function load() {
  await fetchCreances({ retard: seulementRetard.value || undefined })
}

watch(seulementRetard, load)

const totalDu = computed(() => creances.value.reduce((s, c) => s + c.reste, 0))
const totalRetard = computed(() =>
  creances.value.filter((c) => (c.joursRetard ?? -1) >= 0).reduce((s, c) => s + c.reste, 0),
)

// Une échéance dépassée est la seule chose qui rend un bon urgent : sans date
// fixée, un impayé n'est pas encore un retard.
function enRetard(c: Creance) {
  return c.joursRetard !== null && c.joursRetard >= 0
}

function libelleEcheance(c: Creance) {
  if (!c.dateEcheance) return 'Aucune échéance'
  if (c.joursRetard === null) return formatDate(c.dateEcheance)
  if (c.joursRetard >= 0) {
    return `${formatDate(c.dateEcheance)} · ${c.joursRetard} j de retard`
  }
  return `${formatDate(c.dateEcheance)} · dans ${Math.abs(c.joursRetard)} j`
}

const active = ref<Creance | null>(null)
const showReglementModal = ref(false)

function ouvrirReglement(c: Creance) {
  active.value = c
  showReglementModal.value = true
}

await load()
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppCard>
        <p class="text-sm text-muted">Reste à encaisser</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(totalDu) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Dont en retard</p>
        <p class="text-lg font-semibold" :class="totalRetard > 0 ? 'text-rust-dark' : 'text-ink'">
          {{ fcfa(totalRetard) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Bons non soldés</p>
        <p class="text-lg font-semibold text-ink">{{ creances.length }}</p>
      </AppCard>
    </div>

    <div class="flex items-center gap-3">
      <label class="flex cursor-pointer items-center gap-2 text-[13px] text-ink-3">
        <input
          v-model="seulementRetard"
          type="checkbox"
          class="h-4 w-4 rounded border-line text-forest focus:ring-forest/30"
        />
        Échéance dépassée uniquement
      </label>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table v-if="!loading && creances.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Bon</th>
              <th>Échéance</th>
              <th>Chantier</th>
              <th class="text-right">Total</th>
              <th class="text-right">Réglé</th>
              <th class="text-right">Reste</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in creances" :key="c.id" class="row-hover">
              <td>
                <NuxtLink
                  :to="`/clients/${c.clientId}`"
                  class="block font-medium text-ink hover:underline"
                >
                  {{ c.clientNom }}
                </NuxtLink>
                <!-- Le numéro sert à rappeler : il tient sur sa propre ligne
                     plutôt que de casser le nom en deux. -->
                <span
                  v-if="c.clientTelephone"
                  class="mono mt-0.5 flex items-center gap-1 whitespace-nowrap text-[11.5px] text-muted"
                >
                  <Phone class="h-3 w-3 shrink-0" />{{ c.clientTelephone }}
                </span>
              </td>
              <td>
                <NuxtLink
                  :to="`/sorties/${c.id}`"
                  class="mono text-[12.5px] text-ink-3 hover:text-ink"
                >
                  {{ c.reference }}
                </NuxtLink>
              </td>
              <td>
                <span v-if="enRetard(c)" class="text-[12.5px] font-medium text-rust-dark">
                  {{ libelleEcheance(c) }}
                </span>
                <span v-else class="text-[12.5px] text-muted">{{ libelleEcheance(c) }}</span>
              </td>
              <td class="text-muted">{{ c.chantierNom ?? '' }}</td>
              <td class="mono num text-right text-muted">{{ fcfa(c.montantTotal) }}</td>
              <td class="mono num text-right text-muted">{{ fcfa(c.montantPaye) }}</td>
              <td
                class="mono num text-right font-semibold"
                :class="enRetard(c) ? 'text-rust-dark' : 'text-ink'"
              >
                {{ fcfa(c.reste) }}
              </td>
              <td class="text-right">
                <AppButton variant="secondary" size="sm" @click="ouvrirReglement(c)">
                  <Wallet class="h-3.5 w-3.5" />
                  Encaisser
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="8" />

      <AppEmptyState
        v-if="!loading && creances.length === 0"
        :icon="Wallet"
        :title="seulementRetard ? 'Aucune échéance dépassée' : 'Rien à encaisser'"
        :description="
          seulementRetard
            ? 'Toutes les créances en cours sont encore dans les délais.'
            : 'Tous les bons actifs sont soldés. Un bon reste ici tant que son montant total n\'est pas couvert par des règlements.'
        "
      />
    </AppCard>

    <ReglementModal
      v-if="active"
      v-model:open="showReglementModal"
      :sortie-id="active.id"
      :reference="active.reference"
      :client-nom="active.clientNom"
      :reste="active.reste"
      @saved="load"
    />
  </div>
</template>
