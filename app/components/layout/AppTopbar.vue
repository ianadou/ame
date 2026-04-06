<script setup lang="ts">
import { Menu } from 'lucide-vue-next'

defineProps<{
  title: string
}>()

defineEmits<{
  toggleSidebar: []
}>()
</script>

<template>
  <header class="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
    <button
      class="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      @click="$emit('toggleSidebar')"
    >
      <Menu class="h-5 w-5" />
    </button>

    <h1 class="text-lg font-semibold text-slate-900">{{ title }}</h1>
  </header>
</template>
