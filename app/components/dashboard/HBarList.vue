<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items: { nom: string; valeur: number; sub: string }[]
    accent?: 'ochre' | 'forest' | 'slate'
  }>(),
  { accent: 'ochre' },
)

const colorMap = { ochre: '#D9871A', forest: '#2E5A3C', slate: '#475569' }
const accentColor = computed(() => colorMap[props.accent])
const max = computed(() => Math.max(...props.items.map((i) => i.valeur), 1))

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}
</script>

<template>
  <div class="divide-y divide-line/60">
    <div v-if="items.length === 0" class="px-5 py-10 text-center text-[12.5px] text-muted">
      Aucune donnée sur la période.
    </div>
    <div v-for="(it, i) in items" :key="i" class="px-5 py-3 transition-colors hover:bg-paper-4/60">
      <div class="mb-2 flex items-baseline justify-between gap-3">
        <div class="flex min-w-0 items-baseline gap-2.5">
          <span class="mono w-4 shrink-0 text-right text-[10.5px] text-muted">
            {{ String(i + 1).padStart(2, '0') }}
          </span>
          <span class="truncate text-[13px] font-medium text-ink">{{ it.nom }}</span>
        </div>
        <div class="flex shrink-0 items-baseline gap-1.5">
          <span class="mono num text-[13px] font-semibold text-ink">{{ fmt(it.valeur) }}</span>
          <span class="text-[10.5px] text-muted">FCFA</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
          <div
            class="h-full rounded-full"
            :style="{ width: (it.valeur / max) * 100 + '%', background: accentColor }"
          />
        </div>
        <span class="w-[64px] shrink-0 text-right text-[10.5px] text-muted">{{ it.sub }}</span>
      </div>
    </div>
  </div>
</template>
