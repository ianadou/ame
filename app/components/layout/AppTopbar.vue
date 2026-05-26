<script setup lang="ts">
import { Menu } from 'lucide-vue-next'

defineProps<{ title: string; kicker?: string; crumb?: string }>()
defineEmits<{ toggleSidebar: [] }>()

// Horloge réactive — Intl utilise le fuseau du système d'exploitation
// (l'heure affichée correspond donc à la zone du PC : Abidjan en CI,
// Paris en France, etc.). Tick à la minute.
const now = ref(new Date())
let timerId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timerId = setInterval(() => {
    now.value = new Date()
  }, 30_000)
})
onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
})

const fmtJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
const fmtDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
const fmtHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const jour = computed(() => cap(fmtJour.format(now.value)))
const dateStr = computed(() => `${fmtDate.format(now.value)} / ${fmtHeure.format(now.value)}`)
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
        <NotificationBell />
      </div>
    </div>
  </header>
</template>
