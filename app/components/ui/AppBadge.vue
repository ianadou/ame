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
  info: 'bg-indigo-50 text-indigo-700',
  neutral: 'bg-paper-2 text-ink-3',
}
const solidClasses = {
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-rust text-white',
  info: 'bg-indigo-500 text-white',
  neutral: 'bg-slate-500 text-white',
}
const dotClasses = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rust',
  info: 'bg-indigo-500',
  neutral: 'bg-ink-4',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11px] font-medium"
    :class="solid ? solidClasses[variant] : softClasses[variant]"
  >
    <span v-if="!solid" class="h-1.5 w-1.5 rounded-[1px]" :class="dotClasses[variant]" />
    <slot />
  </span>
</template>
