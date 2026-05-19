<script setup lang="ts">
interface Props {
  padding?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: true,
})
</script>

<template>
  <div class="card shadow-soft" :class="{ 'p-5': padding }">
    <slot />
  </div>
</template>
