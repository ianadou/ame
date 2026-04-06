<script setup lang="ts">
import { Search } from 'lucide-vue-next'

defineProps<{
  placeholder?: string
}>()

const model = defineModel<string>()
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder ?? 'Rechercher...'"
      class="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  </div>
</template>
