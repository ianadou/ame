<script setup lang="ts">
import {
  Package,
  Coins,
  AlertTriangle,
  HardHat,
  ArrowDownLeft,
  ArrowUpRight,
  FilePlus,
} from 'lucide-vue-next'

interface DernierMouvement {
  id: string
  type: string
  quantite: number
  articleId: string
  articleNom: string | null
  articleReference: string | null
  fournisseurNom: string | null
  chantierNom: string | null
  createdAt: string
}

interface DashboardData {
  nbArticles: number
  valeurStock: number
  nbAlertes: number
  nbChantiersEnCours: number
  derniersMouvements: DernierMouvement[]
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
const { data: alertes } = await useFetch<ArticleAlerte[]>('/api/alertes')

const stats = computed(() => [
  { title: 'Articles', value: dashboard.value?.nbArticles ?? 0, icon: Package },
  {
    title: 'Valeur du stock',
    value: `${(dashboard.value?.valeurStock ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`,
    icon: Coins,
  },
  { title: 'Alertes stock bas', value: dashboard.value?.nbAlertes ?? 0, icon: AlertTriangle },
  { title: 'Chantiers en cours', value: dashboard.value?.nbChantiersEnCours ?? 0, icon: HardHat },
])

const raccourcis = [
  { label: 'Nouvelle entrée', icon: ArrowDownLeft, to: '/mouvements' },
  { label: 'Nouvelle sortie', icon: ArrowUpRight, to: '/mouvements' },
  { label: 'Nouveau bon de commande', icon: FilePlus, to: '/commandes' },
]

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
  <div class="space-y-6">
    <!-- StatCards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
      />
    </div>

    <!-- Raccourcis -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <AppButton
        v-for="raccourci in raccourcis"
        :key="raccourci.label"
        variant="secondary"
        @click="navigateTo(raccourci.to)"
      >
        <component :is="raccourci.icon" class="h-4 w-4" />
        {{ raccourci.label }}
      </AppButton>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Derniers mouvements -->
      <div>
        <h3 class="mb-3 text-sm font-semibold text-slate-900">Derniers mouvements</h3>
        <AppCard :padding="false">
          <table v-if="dashboard && dashboard.derniersMouvements.length > 0" class="w-full">
            <tbody>
              <tr
                v-for="mvt in dashboard.derniersMouvements"
                :key="mvt.id"
                class="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                @click="navigateTo(`/stock/${mvt.articleId}`)"
              >
                <td class="px-4 py-3">
                  <AppBadge :variant="mvt.type === 'entree' ? 'success' : 'danger'">
                    {{ mvt.type === 'entree' ? 'Entrée' : 'Sortie' }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">
                  {{ mvt.articleReference }} — {{ mvt.articleNom }}
                </td>
                <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">
                  {{ mvt.quantite }}
                </td>
                <td class="px-4 py-3 text-right text-xs text-slate-500">
                  {{ formatDate(mvt.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
          <AppEmptyState
            v-else
            title="Aucun mouvement"
            description="Aucun mouvement de stock enregistré."
          />
        </AppCard>
      </div>

      <!-- Articles en alerte -->
      <div>
        <h3 class="mb-3 text-sm font-semibold text-slate-900">Articles en alerte</h3>
        <AppCard :padding="false">
          <table v-if="alertes && alertes.length > 0" class="w-full">
            <tbody>
              <tr
                v-for="article in alertes"
                :key="article.id"
                class="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                @click="navigateTo(`/stock/${article.id}`)"
              >
                <td class="px-4 py-3 text-sm font-medium text-slate-900">
                  {{ article.reference }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">{{ article.nom }}</td>
                <td class="px-4 py-3 text-right">
                  <AppBadge :variant="article.stockActuel === 0 ? 'danger' : 'warning'">
                    {{ article.stockActuel }} / {{ article.seuilAlerte }} {{ article.unite }}
                  </AppBadge>
                </td>
              </tr>
            </tbody>
          </table>
          <AppEmptyState
            v-else
            title="Aucune alerte"
            description="Tous les articles sont au-dessus de leur seuil d'alerte."
          />
        </AppCard>
      </div>
    </div>
  </div>
</template>
