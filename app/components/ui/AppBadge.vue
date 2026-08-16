<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  // Badge plein (fond saturé, texte blanc, sans point). Sinon variante
  // pastel + point coloré pour les statuts secondaires (paiement, etc.).
  solid?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  solid: false,
})

const softClasses = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-rust-dark',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-paper-2 text-ink-3',
}
// Fonds sur les crans foncés : le texte blanc sur `forest` (#10B981) tombe à
// 2,5:1 et sur `rust` (#EF4444) à 3,8:1, sous le seuil AA de 4,5:1. Les crans
// `-dark` gardent le badge plein voulu tout en passant le contraste.
const solidClasses = {
  success: 'bg-forest-dark text-white',
  warning: 'bg-ochre-dark text-white',
  danger: 'bg-rust-dark text-white',
  info: 'bg-sky-700 text-white',
  neutral: 'bg-slate-500 text-white',
}
const dotClasses = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rust',
  info: 'bg-sky-500',
  neutral: 'bg-ink-4',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-medium"
    :class="solid ? solidClasses[variant] : softClasses[variant]"
  >
    <span v-if="!solid" class="h-1.5 w-1.5 rounded-[1px]" :class="dotClasses[variant]" />
    <slot />
  </span>
</template>
