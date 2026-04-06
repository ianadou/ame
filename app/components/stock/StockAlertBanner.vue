<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{
  count: number
}>()
</script>

<template>
  <div
    v-if="count > 0"
    class="flex items-center gap-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700"
  >
    <AlertTriangle class="h-4 w-4 shrink-0" />
    <span>
      <strong>{{ count }}</strong> article{{ count > 1 ? 's' : '' }} en alerte de stock bas
    </span>
  </div>
</template>
