<script setup lang="ts">
const sidebarOpen = ref(false)
const route = useRoute()

const PAGE_META: Record<string, { title: string; kicker: string; crumb: string }> = {
  '/': { title: 'Tableau de bord', kicker: 'Aperçu général', crumb: "Vue d'ensemble" },
  '/stock': { title: 'Stock', kicker: 'Inventaire articles', crumb: 'Catalogue' },
  '/mouvements': {
    title: 'Transactions',
    kicker: 'Historique approvisionnements et ventes',
    crumb: 'Journal',
  },
  '/commandes': {
    title: 'Commandes',
    kicker: 'Bons de commande fournisseurs',
    crumb: 'Achats',
  },
  '/fournisseurs': { title: 'Fournisseurs', kicker: 'Carnet fournisseurs', crumb: 'Partenaires' },
  '/clients': { title: 'Clients', kicker: 'Carnet clients', crumb: 'Ventes' },
  '/sorties': { title: 'Ventes', kicker: 'Ventes aux clients', crumb: 'Ventes' },
  '/categories': { title: 'Catégories', kicker: 'Familles d’articles', crumb: 'Catalogue' },
  '/chantiers': { title: 'Chantiers', kicker: 'Sites et budgets', crumb: 'Référentiels' },
  '/beneficiaires': {
    title: 'Bénéficiaires',
    kicker: 'Personnel qui retire le matériel',
    crumb: 'Référentiels',
  },
  '/creances': {
    title: 'Créances',
    kicker: 'Bons non soldés et relances',
    crumb: 'Opérations',
  },
  '/retours': { title: 'Retours', kicker: 'Matériel prêté non rendu', crumb: 'Opérations' },
  '/parametres': { title: 'Réglages', kicker: 'Profil et données', crumb: 'Configuration' },
}

const meta = computed(() => {
  const base = '/' + (route.path.split('/')[1] ?? '')
  return PAGE_META[route.path] ?? PAGE_META[base] ?? { title: 'AME', kicker: '', crumb: '' }
})

watch(route, () => {
  sidebarOpen.value = false
})

const { user, load } = useSessionUser()
const anneeCourante = new Date().getFullYear()
const signature = computed(() => user.value.nomEntreprise?.trim() || 'AME')

onMounted(async () => {
  try {
    await load()
  } catch {
    // Table absente / serveur non prêt : la modal bloquante prendra le relais.
  }
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-white">
    <div class="hidden lg:flex">
      <AppSidebar />
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 z-40 bg-black/50 lg:hidden"
          @click="sidebarOpen = false"
        />
      </Transition>
      <Transition name="slide">
        <div v-if="sidebarOpen" class="fixed inset-y-0 left-0 z-50 lg:hidden">
          <AppSidebar @close="sidebarOpen = false" />
        </div>
      </Transition>
    </Teleport>

    <div class="flex flex-1 flex-col overflow-hidden">
      <AppTopbar
        :title="meta.title"
        :kicker="meta.kicker"
        :crumb="meta.crumb"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />
      <main class="flex-1 overflow-y-auto px-4 py-7 lg:px-8">
        <slot />
      </main>
      <footer
        class="grid grid-cols-3 items-center border-t border-line bg-white px-4 py-4 text-[11.5px] text-muted lg:px-8"
      >
        <span>AME / Gestion de stock BTP / Côte d'Ivoire</span>
        <span class="mono text-center tracking-wider2"
          >© AME {{ anneeCourante }} · {{ signature }}</span
        >
        <span class="flex items-center justify-end gap-4">
          <span class="mono">v0.5.1</span>
          <span class="flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 rounded-sm bg-emerald-500" />Base à jour
          </span>
        </span>
      </footer>
    </div>

    <ToastHost />
    <GlobalSearch />
    <SessionUserModal />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 200ms ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
