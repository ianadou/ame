<script setup lang="ts">
const props = withDefaults(
  defineProps<{ values: (number | null)[]; color?: string; height?: number; fill?: boolean }>(),
  { color: '#475569', height: 28, fill: true },
)

const geom = computed(() => {
  const vals = props.values
  const valid = vals.filter((v): v is number => v != null)
  if (!valid.length) return null
  const max = Math.max(...valid)
  const min = Math.min(...valid)
  const range = max - min || 1
  const n = vals.length
  const W = 100
  const stepX = W / (n - 1 || 1)
  const pts: [number, number][] = []
  vals.forEach((v, i) => {
    if (v == null) return
    pts.push([i * stepX, props.height - 2 - ((v - min) / range) * (props.height - 4)])
  })
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const area = `${path} L${pts[pts.length - 1][0]},${props.height} L${pts[0][0]},${props.height} Z`
  return { path, area, W }
})
</script>

<template>
  <svg
    v-if="geom"
    :viewBox="`0 0 ${geom.W} ${height}`"
    preserveAspectRatio="none"
    width="100%"
    :height="height"
  >
    <path v-if="fill" :d="geom.area" :fill="color" fill-opacity="0.12" />
    <path
      :d="geom.path"
      fill="none"
      :stroke="color"
      stroke-width="1.5"
      vector-effect="non-scaling-stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
