<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    entrees: (number | null)[]
    sorties: (number | null)[]
    ticks: string[]
    height?: number
  }>(),
  { height: 240 },
)

const chart = computed(() => {
  const { entrees, sorties } = props
  const n = entrees.length
  const max = Math.max(
    ...entrees.filter((v): v is number => v != null),
    ...sorties.filter((v): v is number => v != null),
    1,
  )
  const W = 100
  const groupW = W / n
  const barW = groupW * 0.32
  const innerH = props.height - 28
  const yTicks = [max, max * 0.75, max * 0.5, max * 0.25, 0]
  const bars = entrees.map((e, i) => {
    const cx = i * groupW + groupW / 2
    const s = sorties[i]
    return {
      projected: e == null,
      eX: cx - barW - 0.25,
      eH: e == null ? 0 : (e / max) * innerH,
      sX: cx + 0.25,
      sH: s == null ? 0 : (s / max) * innerH,
      barW,
    }
  })
  return { W, innerH, yTicks, bars }
})
</script>

<template>
  <div class="relative" :style="{ height: height + 'px' }">
    <div
      class="absolute inset-0"
      style="padding-bottom: 22px; padding-left: 36px; padding-right: 6px"
    >
      <div class="relative h-full w-full">
        <div
          v-for="(t, i) in chart.yTicks"
          :key="i"
          class="absolute left-0 right-0 flex items-center"
          :style="{ top: (i / (chart.yTicks.length - 1)) * 100 + '%' }"
        >
          <span class="mono -ml-9 w-7 text-right text-[10px] tabular-nums text-muted">
            {{ Math.round(t) }}
          </span>
          <div
            class="flex-1 border-t border-line/60"
            :style="{ borderTopStyle: i === chart.yTicks.length - 1 ? 'solid' : 'dashed' }"
          />
        </div>
      </div>
    </div>

    <svg
      :viewBox="`0 0 ${chart.W} ${chart.innerH}`"
      preserveAspectRatio="none"
      class="absolute"
      style="left: 36px; top: 0; width: calc(100% - 42px)"
      :style="{ height: chart.innerH + 'px' }"
    >
      <g v-for="(b, i) in chart.bars" :key="i">
        <template v-if="!b.projected">
          <rect :x="b.eX" :y="chart.innerH - b.eH" :width="b.barW" :height="b.eH" fill="#2E5A3C" />
          <rect :x="b.sX" :y="chart.innerH - b.sH" :width="b.barW" :height="b.sH" fill="#475569" />
        </template>
        <template v-else>
          <rect :x="b.eX" :y="chart.innerH - 0.6" :width="b.barW" height="0.6" fill="#CFC6AE" />
          <rect :x="b.sX" :y="chart.innerH - 0.6" :width="b.barW" height="0.6" fill="#CFC6AE" />
        </template>
      </g>
    </svg>

    <div class="absolute bottom-0 left-9 right-1.5 flex justify-between text-[10.5px] text-muted">
      <span v-for="(t, i) in ticks" :key="i">{{ t }}</span>
    </div>
  </div>
</template>
