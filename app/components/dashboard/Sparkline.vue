<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    values: (number | null)[]
    color?: string
    height?: number
    fill?: boolean
    // Étiquettes de l'axe des abscisses, une par valeur. Sans elles
    // l'infobulle n'aurait pas de quoi nommer le point survolé.
    labels?: string[]
    // Une sparkline de vignette reste muette : elle donne une silhouette,
    // pas des chiffres. Seul le graphe en pleine largeur écoute le pointeur.
    interactive?: boolean
    // Mise en forme de la valeur dans l'infobulle.
    format?: (v: number) => string
  }>(),
  {
    color: '#475569',
    height: 28,
    fill: true,
    labels: () => [],
    interactive: false,
    format: (v: number) => String(Math.round(v)),
  },
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
  const points: { i: number; x: number; y: number; v: number }[] = []
  vals.forEach((v, i) => {
    if (v == null) return
    const x = i * stepX
    const y = props.height - 2 - ((v - min) / range) * (props.height - 4)
    pts.push([x, y])
    points.push({ i, x, y, v })
  })
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const area = `${path} L${pts[pts.length - 1]![0]},${props.height} L${pts[0]![0]},${props.height} Z`
  return { path, area, W, points }
})

const conteneur = ref<HTMLElement | null>(null)
const actif = ref<number | null>(null)

// Le repère accroche le point le plus proche : on vise une date, jamais une
// ligne de deux pixels.
function survol(e: PointerEvent) {
  if (!props.interactive || !geom.value || !conteneur.value) return
  const rect = conteneur.value.getBoundingClientRect()
  const ratio = ((e.clientX - rect.left) / rect.width) * 100
  let proche = geom.value.points[0]!
  for (const p of geom.value.points) {
    if (Math.abs(p.x - ratio) < Math.abs(proche.x - ratio)) proche = p
  }
  actif.value = proche.i
}

const pointActif = computed(() =>
  actif.value === null ? null : (geom.value?.points.find((p) => p.i === actif.value) ?? null),
)
</script>

<template>
  <div ref="conteneur" class="relative" @pointermove="survol" @pointerleave="actif = null">
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
      <template v-if="interactive && pointActif">
        <line
          :x1="pointActif.x"
          y1="0"
          :x2="pointActif.x"
          :y2="height"
          stroke="#94A3B8"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
          stroke-dasharray="3 3"
        />
        <circle
          :cx="pointActif.x"
          :cy="pointActif.y"
          r="3"
          :fill="color"
          stroke="#FFFFFF"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
      </template>
    </svg>

    <div
      v-if="interactive && pointActif"
      class="pointer-events-none absolute top-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-white px-3 py-2 shadow-soft-md"
      :style="{ left: `clamp(3.5rem, ${pointActif.x}%, calc(100% - 3.5rem))` }"
    >
      <div class="mono mb-1 text-[10.5px] uppercase tracking-wider2 text-muted">
        {{ labels[pointActif.i] ?? '' }}
      </div>
      <div class="mono num text-[13px] font-semibold text-ink">
        {{ format(pointActif.v) }}
      </div>
    </div>
  </div>
</template>
