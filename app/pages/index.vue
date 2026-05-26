<script setup lang="ts">
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  FilePlus,
  Package,
  Coins,
  AlertTriangle,
  Users,
  ArrowUpRight as ArrowLink,
  Receipt,
  Pencil,
} from 'lucide-vue-next'
import type { RegimeTva } from '~/composables/useSessionUser'

interface Tendance {
  nom: string
  valeur: number
  sub: string
}
interface Activite {
  label: string
  sub: string
  deltaSub: string
  ticks: string[]
  series: { entrees: (number | null)[]; sorties: (number | null)[] }
  kpi: { mvmts: number; entrees: number; sorties: number; valEntree: number; valSortie: number }
  delta: {
    mvmts: string
    entrees: string
    sorties: string
    valEntree: string
    valSortie: string
  }
}

interface DernierMouvement {
  id: string
  type: string
  quantite: number
  articleId: string
  articleNom: string | null
  articleReference: string | null
  fournisseurNom: string | null
  clientNom: string | null
  createdAt: string
}
interface DashboardData {
  nbArticles: number
  valeurStock: number
  nbAlertes: number
  nbClients: number
  derniersMouvements: DernierMouvement[]
  topClients: Tendance[]
}
interface ArticleAlerte {
  id: string
  reference: string
  nom: string
  categorieNom: string | null
  unite: string
  stockActuel: number
  seuilAlerte: number
}

const { data: dashboard } = await useFetch<DashboardData>('/api/dashboard')
const { data: alertes } = await useFetch<ArticleAlerte[]>('/api/alertes', { default: () => [] })

const period = ref('mois')
const videActivite: Activite = {
  label: 'Mois',
  sub: '',
  deltaSub: '',
  ticks: [],
  series: { entrees: [], sorties: [] },
  kpi: { mvmts: 0, entrees: 0, sorties: 0, valEntree: 0, valSortie: 0 },
  delta: { mvmts: '+0%', entrees: '+0%', sorties: '+0%', valEntree: '+0%', valSortie: '+0%' },
}
const { data: activite } = await useFetch<Activite>('/api/dashboard/activite', {
  query: { periode: period },
  default: () => videActivite,
})
const data = computed(() => activite.value ?? videActivite)

const recent = computed(() => dashboard.value?.derniersMouvements ?? [])
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')
const valeurK = computed(() => fmt((dashboard.value?.valeurStock ?? 0) / 1000))

function fmtDate(iso: string) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(d)
}
function fmtTime(iso: string) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
}

const valEvolution = computed(() =>
  data.value.series.entrees.map((e, i) => {
    const s = data.value.series.sorties[i]
    return e == null ? null : e * 4200 + (s ?? 0) * 5800
  }),
)

// Régime fiscal — affichage + édition rapide depuis le dashboard.
const { user, saveRegimeTva } = useSessionUser()
const notifications = useNotifications()
const showTvaModal = ref(false)
const tvaSubmitting = ref(false)
const regimeLabel = computed(() =>
  user.value.regimeTva === 'assujetti'
    ? `Assujetti TVA ${user.value.tauxTva} %`
    : 'Non assujetti à la TVA',
)
async function handleTvaSubmit(regime: RegimeTva, taux: number) {
  tvaSubmitting.value = true
  try {
    await saveRegimeTva(regime, taux)
    notifications.success(
      'Régime fiscal enregistré',
      regime === 'assujetti' ? `Assujetti TVA ${taux} %` : 'Non assujetti',
    )
    showTvaModal.value = false
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Enregistrement impossible')
        : 'Enregistrement impossible'
    notifications.danger('Enregistrement impossible', msg)
  } finally {
    tvaSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 fade-up">
    <!-- Action row -->
    <div class="flex flex-wrap items-center gap-2.5">
      <AppButton variant="primary" @click="navigateTo('/stock')">
        <Plus class="h-4 w-4" />Nouvel article
      </AppButton>
      <AppButton variant="secondary" @click="navigateTo('/mouvements')">
        <ArrowDownLeft class="h-4 w-4" />Approvisionnement
      </AppButton>
      <AppButton variant="secondary" @click="navigateTo('/sorties/nouveau')">
        <ArrowUpRight class="h-4 w-4" />Nouvelle vente
      </AppButton>
      <AppButton variant="secondary" @click="navigateTo('/commandes')">
        <FilePlus class="h-4 w-4" />Bon de commande
      </AppButton>

      <button
        class="ml-auto flex items-center gap-2 rounded-md border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:bg-paper-2"
        title="Modifier le régime fiscal"
        @click="showTvaModal = true"
      >
        <Receipt class="h-3.5 w-3.5 text-ink-3" />
        <span class="text-muted">Régime fiscal :</span>
        <span class="font-medium text-ink">{{ regimeLabel }}</span>
        <Pencil class="h-3 w-3 text-ink-4" />
      </button>
    </div>

    <!-- Global KPI -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Articles référencés"
        :value="fmt(dashboard?.nbArticles ?? 0)"
        :icon="Package"
        :spark="[26, 27, 28, 27, 29, 29, 30, 30]"
        spark-color="#475569"
      />
      <KpiCard
        label="Valeur du stock"
        :value="valeurK"
        unit="K FCFA"
        :icon="Coins"
        delta="+12%"
        delta-sub="vs mois dernier"
        :spark="[265, 272, 268, 281, 290, 285, 298, 305]"
        spark-color="#10B981"
      />
      <KpiCard
        label="Alertes stock bas"
        :value="fmt(alertes?.length ?? 0)"
        :icon="AlertTriangle"
        :tone="(alertes?.length ?? 0) > 0 ? 'danger' : 'success'"
        :delta="(alertes?.length ?? 0) > 0 ? '+1' : null"
        :delta-sub="(alertes?.length ?? 0) > 0 ? 'à traiter' : null"
        :spark="[0, 0, 1, 0, 2, 1, 0, 1]"
        spark-color="#EF4444"
      />
      <KpiCard
        label="Clients"
        :value="fmt(dashboard?.nbClients ?? 0)"
        :icon="Users"
        :spark="[4, 4, 5, 5, 5, 6, 6, 6]"
        spark-color="#475569"
      />
    </div>

    <!-- Period header -->
    <div class="flex flex-wrap items-end justify-between gap-3 pt-2">
      <div>
        <div class="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Activité</div>
        <div class="flex items-baseline gap-3">
          <h2 class="text-[20px] font-semibold leading-none">Analyse par période</h2>
          <span class="text-[13px] text-muted">· {{ data.sub }}</span>
        </div>
      </div>
      <PeriodTabs v-model="period" />
    </div>

    <!-- Period KPI -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard
        label="Transactions"
        :value="fmt(data.kpi.mvmts)"
        :delta="data.delta.mvmts"
        :delta-sub="data.deltaSub"
        :spark="
          data.series.entrees.map((e, i) => (e == null ? null : e + (data.series.sorties[i] ?? 0)))
        "
        spark-color="#0F172A"
      />
      <KpiCard
        label="Approvisionnements"
        :value="fmt(data.kpi.entrees)"
        :delta="data.delta.entrees"
        :delta-sub="data.deltaSub"
        :spark="data.series.entrees"
        spark-color="#10B981"
      />
      <KpiCard
        label="Ventes"
        :value="fmt(data.kpi.sorties)"
        :delta="data.delta.sorties"
        :delta-sub="data.deltaSub"
        :spark="data.series.sorties"
        spark-color="#475569"
      />
      <KpiCard
        label="Valeur achetée"
        :value="fmt(data.kpi.valEntree / 1000)"
        unit="K FCFA"
        :delta="data.delta.valEntree"
        :delta-sub="data.deltaSub"
        :spark="data.series.entrees.map((v) => (v == null ? null : v * 5200))"
        spark-color="#10B981"
      />
      <KpiCard
        label="Valeur vendue"
        :value="fmt(data.kpi.valSortie / 1000)"
        unit="K FCFA"
        :delta="data.delta.valSortie"
        :delta-sub="data.deltaSub"
        :spark="data.series.sorties.map((v) => (v == null ? null : v * 5800))"
        spark-color="#475569"
      />
    </div>

    <!-- Approvisionnements vs ventes (pleine largeur) -->
    <PanelCard
      :kicker="'Transactions / ' + data.label.toLowerCase()"
      title="Approvisionnements vs ventes"
    >
      <template #action>
        <div class="flex items-center gap-4 text-[11.5px]">
          <span class="flex items-center gap-1.5"
            ><span class="h-2.5 w-2.5 rounded-[2px] bg-forest" />Approvisionnements</span
          >
          <span class="flex items-center gap-1.5"
            ><span class="h-2.5 w-2.5 rounded-[2px] bg-slate-600" />Ventes</span
          >
        </div>
      </template>
      <div class="px-4 pb-3 pt-5">
        <BarChart
          :entrees="data.series.entrees"
          :sorties="data.series.sorties"
          :ticks="data.ticks"
          :height="240"
        />
      </div>
    </PanelCard>

    <!-- Value evolution -->
    <PanelCard
      :kicker="'Évolution / ' + data.label.toLowerCase()"
      title="Valeur des transactions (FCFA)"
    >
      <template #action
        ><span class="text-[11.5px] text-muted">Cumul entrées + sorties</span></template
      >
      <div class="px-5 pb-4 pt-5">
        <Sparkline :values="valEvolution" color="#475569" :height="160" />
      </div>
    </PanelCard>

    <!-- Top clients (pleine largeur) -->
    <PanelCard :kicker="'Ventes / ' + data.label.toLowerCase()" title="Top clients">
      <template #action><span class="text-[11.5px] text-muted">FCFA HT</span></template>
      <HBarList :items="dashboard?.topClients ?? []" accent="forest" />
    </PanelCard>

    <!-- Latest + Alertes -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <PanelCard
        class="lg:col-span-7"
        kicker="5 dernières opérations"
        title="Dernières transactions"
      >
        <template #action>
          <button
            class="flex items-center gap-1 text-[12px] text-muted hover:text-ink"
            @click="navigateTo('/mouvements')"
          >
            Tout voir <ArrowLink class="h-3 w-3" />
          </button>
        </template>
        <table class="w-full">
          <tbody>
            <tr
              v-for="(m, i) in recent"
              :key="m.id"
              :class="i < recent.length - 1 ? 'border-b border-line/60' : ''"
            >
              <td class="w-[88px] py-2.5 pl-5 pr-2">
                <AppBadge :variant="m.type === 'entree' ? 'success' : 'neutral'">
                  {{ m.type === 'entree' ? 'Approvisionnement' : 'Vente' }}
                </AppBadge>
              </td>
              <td class="mono w-[80px] px-2 py-2.5 text-[12px] text-ink-2">
                {{ m.articleReference }}
              </td>
              <td class="truncate px-2 py-2.5 text-[13px] text-ink">{{ m.articleNom }}</td>
              <td class="w-[140px] truncate px-2 py-2.5 text-[12.5px] text-muted">
                {{ m.fournisseurNom || m.clientNom || '' }}
              </td>
              <td class="mono num w-[58px] px-2 py-2.5 text-right text-[13.5px] font-semibold">
                {{ m.type === 'entree' ? '+' : '−' }}{{ m.quantite }}
              </td>
              <td class="mono w-[100px] py-2.5 pl-2 pr-5 text-right text-[11px] text-muted">
                {{ fmtDate(m.createdAt) }}<br />{{ fmtTime(m.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </PanelCard>

      <PanelCard class="lg:col-span-5" title="Articles en alerte">
        <template #kicker>
          <span class="inline-flex items-center gap-1.5 text-rust-dark">
            <span class="h-1.5 w-1.5 rounded-[1px] bg-rust" />
            <span>{{ alertes?.length ?? 0 }} en seuil critique / réappro nécessaire</span>
          </span>
        </template>
        <template #action>
          <AppButton variant="secondary" size="sm" @click="navigateTo('/stock')">Gérer</AppButton>
        </template>
        <div class="divide-y divide-line/60">
          <div
            v-for="a in (alertes ?? []).slice(0, 6)"
            :key="a.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-paper-2"
          >
            <div class="mono w-[68px] shrink-0 text-[11px] text-ink-3">{{ a.reference }}</div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[13px] font-medium text-ink">{{ a.nom }}</div>
              <div class="mt-0.5 text-[11px] text-muted">{{ a.categorieNom ?? '' }}</div>
            </div>
            <div class="w-[110px]">
              <div class="flex items-baseline justify-end gap-1">
                <span
                  class="mono num text-[14.5px] font-semibold"
                  :class="a.stockActuel <= a.seuilAlerte ? 'text-rust-dark' : 'text-amber-700'"
                >
                  {{ a.stockActuel }}
                </span>
                <span class="text-[11px] text-muted">/ {{ a.seuilAlerte }} {{ a.unite }}</span>
              </div>
              <div class="mt-1 h-1 overflow-hidden rounded-full bg-paper-2">
                <div
                  class="h-full rounded-full"
                  :class="a.stockActuel <= a.seuilAlerte ? 'bg-rust' : 'bg-ochre'"
                  :style="{ width: Math.min(100, (a.stockActuel / a.seuilAlerte) * 100) + '%' }"
                />
              </div>
            </div>
          </div>
          <div
            v-if="(alertes?.length ?? 0) === 0"
            class="px-5 py-10 text-center text-[13px] text-muted"
          >
            Aucune alerte, tout est au-dessus du seuil.
          </div>
        </div>
      </PanelCard>
    </div>

    <AppModal v-model:open="showTvaModal" title="Régime fiscal">
      <RegimeTvaForm
        :regime="user.regimeTva"
        :taux="user.tauxTva"
        :submitting="tvaSubmitting"
        @submit="handleTvaSubmit"
        @cancel="showTvaModal = false"
      />
    </AppModal>
  </div>
</template>
