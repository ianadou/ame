<script setup lang="ts">
const props = defineProps<{ ok: number; warn: number; low: number }>()

const d = computed(() => {
  const total = props.ok + props.warn + props.low || 1
  const r = 38
  const c = 2 * Math.PI * r
  const sOk = (props.ok / total) * c
  const sWarn = (props.warn / total) * c
  const sLow = (props.low / total) * c
  return { total, r, c, sOk, sWarn, sLow }
})
</script>

<template>
  <div class="flex items-center gap-5">
    <svg width="116" height="116" viewBox="0 0 116 116">
      <circle cx="58" cy="58" :r="d.r" fill="none" stroke="#F0EAD8" stroke-width="12" />
      <g transform="rotate(-90 58 58)">
        <circle
          cx="58"
          cy="58"
          :r="d.r"
          fill="none"
          stroke="#2E5A3C"
          stroke-width="12"
          :stroke-dasharray="`${d.sOk} ${d.c - d.sOk}`"
        />
        <circle
          cx="58"
          cy="58"
          :r="d.r"
          fill="none"
          stroke="#D9871A"
          stroke-width="12"
          :stroke-dasharray="`${d.sWarn} ${d.c - d.sWarn}`"
          :stroke-dashoffset="-d.sOk"
        />
        <circle
          cx="58"
          cy="58"
          :r="d.r"
          fill="none"
          stroke="#9E3A20"
          stroke-width="12"
          :stroke-dasharray="`${d.sLow} ${d.c - d.sLow}`"
          :stroke-dashoffset="-(d.sOk + d.sWarn)"
        />
      </g>
      <text
        x="58"
        y="59"
        text-anchor="middle"
        class="display"
        font-size="22"
        font-weight="700"
        fill="#1B1A14"
        dominant-baseline="middle"
      >
        {{ d.total }}
      </text>
      <text x="58" y="74" text-anchor="middle" font-size="8" fill="#7A7460">articles</text>
    </svg>
    <div class="space-y-2 text-[12.5px]">
      <div class="flex items-center gap-2.5">
        <span class="h-2.5 w-2.5 rounded-full bg-forest" />
        <span class="mono num w-5 text-right font-semibold text-ink">{{ ok }}</span>
        <span class="text-muted">en stock</span>
      </div>
      <div class="flex items-center gap-2.5">
        <span class="h-2.5 w-2.5 rounded-full bg-ochre" />
        <span class="mono num w-5 text-right font-semibold text-ink">{{ warn }}</span>
        <span class="text-muted">limite</span>
      </div>
      <div class="flex items-center gap-2.5">
        <span class="h-2.5 w-2.5 rounded-full bg-rust" />
        <span class="mono num w-5 text-right font-semibold text-ink">{{ low }}</span>
        <span class="text-muted">stock bas</span>
      </div>
    </div>
  </div>
</template>
