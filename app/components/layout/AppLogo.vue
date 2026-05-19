<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 36 })
</script>

<template>
  <div class="flex items-center gap-2.5">
    <svg :width="size" :height="size" viewBox="0 0 64 64" aria-label="AME" class="shrink-0">
      <rect width="64" height="64" fill="#0F172A" />
      <g fill="#F59E0B">
        <rect x="10" y="42" width="14" height="8" />
        <rect x="26" y="30" width="14" height="8" />
        <rect x="26" y="42" width="14" height="8" />
        <rect x="42" y="18" width="14" height="8" />
        <rect x="42" y="30" width="14" height="8" />
        <rect x="42" y="42" width="14" height="8" />
      </g>
    </svg>
    <div class="leading-none">
      <div class="display text-[24px] font-bold tracking-display text-ink">AME</div>
      <div class="mt-1 text-[9.5px] font-medium uppercase tracking-wider2 text-muted">
        Stock BTP
      </div>
    </div>
  </div>
</template>
