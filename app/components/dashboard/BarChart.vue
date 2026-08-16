<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    entrees: (number | null)[]
    sorties: (number | null)[]
    ticks: string[]
    // Une étiquette par barre, pour nommer la période survolée. Les `ticks`
    // ne jalonnent que l axe et sont bien plus rares que les barres.
    libelles?: string[]
    height?: number
  }>(),
  { libelles: () => [], height: 240 },
)

// Vert et ochre du projet sur leurs crans foncés. Le gris ardoise utilisé
// auparavant pour les ventes n'avait pas assez de chroma pour tenir comme
// couleur de série (il se lisait comme une absence de couleur), et le vert
// vif passait sous 3:1 contre le fond. La séparation reste modeste pour un
// œil protanope : la position fixe dans le groupe, approvisionnements à
// gauche et ventes à droite, porte l'identité autant que la teinte.
const COULEUR_ENTREES = '#047857'
const COULEUR_SORTIES = '#A06410'

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
      cx,
      groupW,
      eX: cx - barW - 0.25,
      eH: e == null ? 0 : (e / max) * innerH,
      sX: cx + 0.25,
      sH: s == null ? 0 : (s / max) * innerH,
      barW,
    }
  })
  return { W, innerH, yTicks, bars }
})

// La cible de survol est le groupe entier, pas la barre : le lecteur vise une
// période, jamais un rectangle de quelques pixels. Une seule infobulle donne
// les deux séries à la fois.
const actif = ref<number | null>(null)

const infobulle = computed(() => {
  if (actif.value === null) return null
  const i = actif.value
  return {
    periode: props.libelles[i] ?? '',
    cx: chart.value.bars[i]?.cx ?? 0,
    entrees: props.entrees[i],
    sorties: props.sorties[i],
    projete: props.entrees[i] == null,
  }
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
        <rect
          v-if="actif === i"
          :x="b.cx - b.groupW / 2"
          y="0"
          :width="b.groupW"
          :height="chart.innerH"
          fill="#0F172A"
          fill-opacity="0.04"
        />
        <template v-if="!b.projected">
          <rect
            :x="b.eX"
            :y="chart.innerH - b.eH"
            :width="b.barW"
            :height="b.eH"
            :fill="COULEUR_ENTREES"
          />
          <rect
            :x="b.sX"
            :y="chart.innerH - b.sH"
            :width="b.barW"
            :height="b.sH"
            :fill="COULEUR_SORTIES"
          />
        </template>
        <template v-else>
          <rect :x="b.eX" :y="chart.innerH - 0.6" :width="b.barW" height="0.6" fill="#CFC6AE" />
          <rect :x="b.sX" :y="chart.innerH - 0.6" :width="b.barW" height="0.6" fill="#CFC6AE" />
        </template>

        <rect
          :x="b.cx - b.groupW / 2"
          y="0"
          :width="b.groupW"
          :height="chart.innerH"
          fill="transparent"
          tabindex="0"
          role="button"
          :aria-label="`${libelles[i] ?? ''} : ${entrees[i] ?? 0} approvisionnements, ${sorties[i] ?? 0} ventes`"
          class="cursor-pointer focus:outline-none"
          @pointerenter="actif = i"
          @pointerleave="actif = null"
          @focus="actif = i"
          @blur="actif = null"
        />
      </g>
    </svg>

    <!-- Calque d'infobulle aligné sur la zone de tracé du SVG. -->
    <div class="pointer-events-none absolute bottom-[22px] top-0" style="left: 36px; right: 6px">
      <div
        v-if="infobulle"
        class="absolute top-2 -translate-x-1/2 rounded-md border border-line bg-white px-3 py-2 shadow-soft-md"
        :style="{ left: infobulle.cx + '%' }"
      >
        <div
          class="mono mb-1.5 whitespace-nowrap text-[10.5px] uppercase tracking-wider2 text-muted"
        >
          {{ infobulle.periode }}
        </div>
        <p v-if="infobulle.projete" class="whitespace-nowrap text-[12px] text-muted">
          Période à venir
        </p>
        <template v-else>
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span class="h-0.5 w-3 rounded-full" :style="{ background: COULEUR_ENTREES }" />
            <span class="mono num text-[13px] font-semibold text-ink">{{
              entrees[actif!] ?? 0
            }}</span>
            <span class="text-[11.5px] text-muted">approvisionnements</span>
          </div>
          <div class="mt-1 flex items-center gap-2 whitespace-nowrap">
            <span class="h-0.5 w-3 rounded-full" :style="{ background: COULEUR_SORTIES }" />
            <span class="mono num text-[13px] font-semibold text-ink">{{
              sorties[actif!] ?? 0
            }}</span>
            <span class="text-[11.5px] text-muted">ventes</span>
          </div>
        </template>
      </div>
    </div>

    <div class="absolute bottom-0 left-9 right-1.5 flex justify-between text-[10.5px] text-muted">
      <span v-for="(t, i) in ticks" :key="i">{{ t }}</span>
    </div>
  </div>
</template>
