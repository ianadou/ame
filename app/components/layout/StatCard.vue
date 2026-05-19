<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  value: string | number
  icon: Component
  trend?: 'up' | 'down' | 'neutral'
}>()
</script>

<template>
  <AppCard>
    <div class="flex items-center gap-4">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-600"
      >
        <component :is="icon" class="h-5 w-5" />
      </div>
      <div>
        <p class="text-sm text-slate-500">{{ title }}</p>
        <p class="text-lg font-semibold text-slate-900">{{ value }}</p>
      </div>
    </div>
  </AppCard>
</template>
