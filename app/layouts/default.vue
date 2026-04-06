<script setup lang="ts">
const sidebarOpen = ref(false)
const route = useRoute()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/stock': 'Stock',
    '/mouvements': 'Mouvements',
    '/commandes': 'Commandes',
    '/fournisseurs': 'Fournisseurs',
    '/chantiers': 'Chantiers',
  }
  return titles[route.path] ?? 'AME'
})

watch(route, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar desktop -->
    <div class="hidden lg:flex">
      <AppSidebar />
    </div>

    <!-- Sidebar mobile overlay -->
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

    <!-- Main content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <AppTopbar :title="pageTitle" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <slot />
      </main>
    </div>
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
