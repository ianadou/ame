<script setup lang="ts">
defineProps<{ title?: string; kicker?: string }>()
</script>

<template>
  <div class="card shadow-soft">
    <div
      v-if="title || kicker || $slots.action"
      class="flex items-end justify-between gap-3 border-b border-line/70 px-5 py-4"
    >
      <div>
        <div v-if="kicker" class="mb-1 text-[11px] text-muted">
          <slot name="kicker">{{ kicker }}</slot>
        </div>
        <div v-if="title" class="text-[15px] font-semibold leading-none text-ink">{{ title }}</div>
      </div>
      <slot name="action" />
    </div>
    <slot />
  </div>
</template>
