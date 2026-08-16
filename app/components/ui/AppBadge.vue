<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
})

// Pastille pastel : fond très clair, texte foncé de la même teinte, sans
// point. Un tableau de vingt lignes ne doit pas devenir un mur de couleur
// saturée ; le statut se lit sans crier. Les couples restent au-dessus de
// 4,5:1, le seuil AA, malgré la légèreté du fond.
const classes = {
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-rust-dark',
  info: 'bg-sky-50 text-sky-800',
  neutral: 'bg-paper-2 text-ink-3',
}
</script>

<template>
  <span
    class="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-medium"
    :class="classes[variant]"
  >
    <slot />
  </span>
</template>
