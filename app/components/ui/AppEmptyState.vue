<script setup lang="ts">
import { PackageOpen } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-14 text-center">
    <PackageOpen class="h-10 w-10 text-line-3" />
    <h3 class="mt-4 text-[14px] font-semibold text-ink">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-[12.5px] text-muted">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
