<script setup lang="ts">
import { PackageOpen } from 'lucide-vue-next'
import type { Component } from 'vue'

// L'icône par défaut convient au stock ; ailleurs, le même carton ouvert
// annonçait « aucun chantier » comme « aucun retour ». Les pages passent
// l'icône de leur entrée de navigation, l'écran vide reste reconnaissable.
withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: Component
  }>(),
  {
    description: undefined,
    icon: undefined,
  },
)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-14 text-center">
    <component :is="icon ?? PackageOpen" class="h-10 w-10 text-line-3" />
    <h3 class="mt-4 text-[14px] font-semibold text-ink">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-[12.5px] text-muted">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
