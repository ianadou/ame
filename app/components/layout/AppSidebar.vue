<script setup lang="ts">
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  Users,
  PackageMinus,
  Tags,
  Settings,
  Search,
} from 'lucide-vue-next'

const { openSearch } = useGlobalSearch()

defineProps<{ collapsed?: boolean }>()
defineEmits<{ close: [] }>()

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Stock', to: '/stock', icon: Package },
  { name: 'Catégories', to: '/categories', icon: Tags },
  { name: 'Ventes', to: '/sorties', icon: PackageMinus },
  { name: 'Transactions', to: '/mouvements', icon: ArrowLeftRight },
  { name: 'Commandes', to: '/commandes', icon: ShoppingCart },
  { name: 'Fournisseurs', to: '/fournisseurs', icon: Truck },
  { name: 'Clients', to: '/clients', icon: Users },
  { name: 'Réglages', to: '/parametres', icon: Settings },
]

const { data: alertes } = await useFetch<unknown[]>('/api/alertes', { default: () => [] })
const { data: dashboard } = await useFetch<{ valeurStock: number }>('/api/dashboard', {
  default: () => ({ valeurStock: 0 }),
})

const nbAlertes = computed(() => alertes.value?.length ?? 0)
const valeurK = computed(() =>
  Math.round((dashboard.value?.valeurStock ?? 0) / 1000).toLocaleString('fr-FR'),
)

const { user, editing } = useSessionUser()
const initiales = computed(() => (user.value.nomEntreprise?.[0] ?? 'A').toUpperCase())
const nomComplet = computed(() => user.value.nomEntreprise?.trim() || 'Entreprise')
</script>

<template>
  <aside class="flex h-full w-[232px] shrink-0 flex-col border-r border-line bg-white">
    <div class="border-b border-line px-5 py-5">
      <AppLogo />
    </div>

    <div class="px-3 pb-3 pt-4">
      <button
        class="flex w-full items-center gap-2 rounded-md border border-line bg-paper-2 px-3 py-2 text-left text-[12.5px] text-ink-3 hover:bg-paper-4"
        @click="openSearch"
      >
        <Search class="h-3.5 w-3.5" />
        <span class="flex-1">Rechercher…</span>
        <span class="mono rounded border border-line bg-white px-1 py-px text-[10px] text-muted">
          ⌘K
        </span>
      </button>
    </div>

    <div class="px-5 pb-1.5 pt-2">
      <div class="mono text-[9.5px] uppercase tracking-wider2 text-muted">Atelier</div>
    </div>

    <nav class="flex-1 space-y-px overflow-y-auto px-3">
      <NuxtLink
        v-for="item in navigation"
        :key="item.name"
        :to="item.to"
        class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13.5px] text-ink-3 transition-colors hover:bg-paper-2/60 hover:text-ink"
        active-class="!bg-paper-2 !text-ink font-medium"
        @click="$emit('close')"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        <span>{{ item.name }}</span>
        <span
          v-if="item.to === '/stock' && nbAlertes > 0"
          class="ml-auto inline-flex items-center rounded-full bg-rust px-2 py-px text-[10.5px] font-semibold text-white"
        >
          {{ nbAlertes }}
        </span>
      </NuxtLink>
    </nav>

    <div class="space-y-3 border-t border-line px-4 py-4">
      <div class="flex items-baseline justify-between">
        <span class="text-[11px] text-muted">Valeur stock</span>
        <span class="mono text-[10px] text-muted">HT</span>
      </div>
      <div class="display num text-[26px] font-semibold leading-none text-ink">
        {{ valeurK }}<span class="ml-1 text-[13px] text-muted">K FCFA</span>
      </div>

      <button
        class="mt-1 flex w-full items-center gap-2.5 rounded-md border-t border-line pt-3 text-left transition-colors hover:opacity-80"
        title="Modifier mon profil"
        @click="editing = true"
      >
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11.5px] font-semibold text-white"
        >
          {{ initiales }}
        </div>
        <div class="leading-tight">
          <div class="text-[12.5px] font-medium text-ink">{{ nomComplet }}</div>
          <div class="text-[11px] text-muted">Gérant</div>
        </div>
      </button>
    </div>
  </aside>
</template>
