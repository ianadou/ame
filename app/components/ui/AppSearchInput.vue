<script setup lang="ts">
import { Search } from 'lucide-vue-next'

defineProps<{ placeholder?: string }>()
const model = defineModel<string>()
</script>

<template>
  <div
    class="flex items-center rounded-md border border-line bg-white transition-all focus-within:border-ink-4 focus-within:shadow-soft"
  >
    <span class="pl-3 text-muted"><Search class="h-[15px] w-[15px]" /></span>
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder ?? 'Rechercher…'"
      class="h-9 w-full rounded-md bg-transparent pl-2 pr-3 text-[13px] text-ink placeholder:text-muted/80 focus:outline-none"
    />
  </div>
</template>
