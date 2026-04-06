<script setup lang="ts">
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  HardHat,
} from 'lucide-vue-next'

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Stock', to: '/stock', icon: Package },
  { name: 'Mouvements', to: '/mouvements', icon: ArrowLeftRight },
  { name: 'Commandes', to: '/commandes', icon: ShoppingCart },
  { name: 'Fournisseurs', to: '/fournisseurs', icon: Truck },
  { name: 'Chantiers', to: '/chantiers', icon: HardHat },
]

defineProps<{
  collapsed?: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <aside
    class="flex h-full flex-col border-r border-slate-200 bg-white"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
      <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-sm font-semibold text-white">
        A
      </div>
      <span v-if="!collapsed" class="text-lg font-semibold text-slate-900">AME</span>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-4">
      <NuxtLink
        v-for="item in navigation"
        :key="item.name"
        :to="item.to"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        active-class="!bg-primary-50 !text-primary-700"
        @click="$emit('close')"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed">{{ item.name }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
