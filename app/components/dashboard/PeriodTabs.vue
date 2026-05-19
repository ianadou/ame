<script setup lang="ts">
const model = defineModel<string>({ required: true })
const items = [
  { id: 'jour', label: 'Jour' },
  { id: 'semaine', label: 'Semaine' },
  { id: 'mois', label: 'Mois' },
  { id: 'annee', label: 'Année' },
]
</script>

<template>
  <div class="inline-flex gap-1 rounded-lg border border-line bg-paper-2 p-1">
    <button
      v-for="it in items"
      :key="it.id"
      class="h-7 rounded-md px-3.5 text-[12px] font-medium transition-all"
      :class="model === it.id ? 'bg-white text-ink shadow-soft' : 'text-ink-3 hover:text-ink'"
      @click="model = it.id"
    >
      {{ it.label }}
    </button>
  </div>
</template>
