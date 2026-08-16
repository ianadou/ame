<script setup lang="ts">
import type { Component } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps<{
  label: string
  value: string | number
  unit?: string
  icon?: Component
  delta?: string | null
  deltaSub?: string | null
  tone?: 'danger' | 'warning' | 'success'
  spark?: (number | null)[]
  sparkColor?: string
  // Destination de la carte. Un chiffre de tableau de bord appelle toujours
  // la question « lesquels ? » : la carte doit y mener d'un clic.
  to?: string
}>()

const toneStyles = {
  danger: {
    card: 'bg-red-50 border-transparent',
    label: 'text-rust-dark',
    value: 'text-rust-dark',
    iconBg: 'bg-rust text-white',
  },
  warning: {
    card: 'bg-amber-50 border-transparent',
    label: 'text-amber-700',
    value: 'text-amber-800',
    iconBg: 'bg-amber-500 text-white',
  },
  success: {
    card: 'bg-emerald-50 border-transparent',
    label: 'text-emerald-700',
    value: 'text-emerald-700',
    iconBg: 'bg-emerald-500 text-white',
  },
}
const t = computed(() => (props.tone ? toneStyles[props.tone] : null))
const isUp = computed(() => props.delta?.startsWith('+'))
const isDown = computed(() => props.delta?.startsWith('-') || props.delta?.startsWith('−'))
const deltaText = computed(() => props.delta?.replace(/^[+\-−]/, ''))
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="card relative block overflow-hidden p-5 text-left shadow-soft"
    :class="[
      t?.card,
      to
        ? 'transition-shadow hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40'
        : '',
    ]"
  >
    <div class="mb-3 flex items-start justify-between gap-2">
      <div class="text-[12px] font-medium" :class="t ? t.label : 'text-muted'">{{ label }}</div>
      <div
        v-if="icon"
        class="flex h-7 w-7 items-center justify-center rounded-md"
        :class="t ? t.iconBg : 'bg-paper-2 text-ink-3'"
      >
        <component :is="icon" class="h-3.5 w-3.5" />
      </div>
    </div>

    <div class="flex items-baseline gap-1.5">
      <div
        class="display num text-[36px] font-semibold leading-[0.95]"
        :class="t ? t.value : 'text-ink'"
      >
        {{ value }}
      </div>
      <div v-if="unit" class="text-[12.5px] font-medium" :class="t ? t.label : 'text-muted'">
        {{ unit }}
      </div>
    </div>

    <div v-if="delta || spark" class="mt-3 flex items-center justify-between gap-3">
      <div v-if="delta" class="flex items-center gap-1.5">
        <span
          class="inline-flex items-center gap-0.5 rounded px-1.5 py-[1.5px] text-[11px] font-semibold"
          :class="
            isUp
              ? 'text-emerald-700 bg-emerald-100'
              : isDown
                ? 'text-rust-dark bg-red-100'
                : 'text-ink-3 bg-paper-2'
          "
        >
          <span v-if="isUp">↑</span><span v-else-if="isDown">↓</span> {{ deltaText }}
        </span>
        <span v-if="deltaSub" class="text-[11px] text-muted">{{ deltaSub }}</span>
      </div>
      <span v-else />
      <div v-if="spark" class="-mb-1 -mr-1 w-[88px]">
        <Sparkline
          :values="spark"
          :color="sparkColor || (t ? '#9E3A20' : '#475569')"
          :height="28"
        />
      </div>
    </div>
  </component>
</template>
