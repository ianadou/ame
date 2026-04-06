<script setup lang="ts">
import { PackageOpen } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <PackageOpen class="h-12 w-12 text-slate-300" />
    <h3 class="mt-4 text-sm font-medium text-slate-900">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
