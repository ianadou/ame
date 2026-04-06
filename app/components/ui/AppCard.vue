<script setup lang="ts">
interface Props {
  padding?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: true,
})
</script>

<template>
  <div
    class="rounded-lg border border-slate-200 bg-white"
    :class="{ 'p-5': padding }"
  >
    <slot />
  </div>
</template>
