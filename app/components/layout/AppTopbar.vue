<script setup lang="ts">
import { Menu, Bell } from 'lucide-vue-next'

defineProps<{ title: string; kicker?: string; crumb?: string }>()
defineEmits<{ toggleSidebar: [] }>()

const now = new Date()
const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const mois = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]
const p2 = (n: number) => String(n).padStart(2, '0')
const jour = jours[now.getDay()]
const dateStr = `${p2(now.getDate())} ${mois[now.getMonth()]} ${now.getFullYear()} / ${p2(now.getHours())}:${p2(now.getMinutes())}`
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-line bg-white">
    <div class="flex items-end justify-between gap-6 px-4 py-5 lg:px-8">
      <div class="flex items-end gap-3">
        <button
          class="mb-0.5 rounded-md border border-line p-2 text-ink-3 hover:bg-paper-2 lg:hidden"
          @click="$emit('toggleSidebar')"
        >
          <Menu class="h-5 w-5" />
        </button>
        <div>
          <div v-if="kicker" class="mb-1.5 text-[12px] text-muted">{{ kicker }}</div>
          <div class="flex items-baseline gap-3">
            <h1 class="text-[22px] font-semibold leading-none text-ink">{{ title }}</h1>
            <span v-if="crumb" class="text-[12.5px] text-muted">· {{ crumb }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden text-right leading-tight sm:block">
          <div class="text-[11px] text-muted">{{ jour }}</div>
          <div class="mono text-[12.5px] text-ink">{{ dateStr }}</div>
        </div>
        <div class="hidden h-8 w-px bg-line sm:block" />
        <button
          class="relative flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white hover:bg-paper-4"
        >
          <Bell class="h-4 w-4" />
          <span
            class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[9px] font-semibold text-white"
          >
            1
          </span>
        </button>
      </div>
    </div>
  </header>
</template>
