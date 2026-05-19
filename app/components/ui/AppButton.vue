<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'sm'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'default',
  loading: false,
  disabled: false,
})

const variantClasses = {
  primary: 'bg-ink text-white hover:bg-ink-2 shadow-soft focus:ring-ink',
  secondary:
    'border border-line bg-white text-ink hover:bg-paper-4 hover:border-line-2 shadow-soft focus:ring-line-2',
  ghost: 'text-ink-3 hover:text-ink hover:bg-paper-2 focus:ring-line-2',
}

const sizeClasses = {
  default: 'h-9 px-3.5 text-[13px]',
  sm: 'h-8 px-2.5 text-[12px]',
}
</script>

<template>
  <button
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variantClasses[variant], sizeClasses[size]]"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot />
  </button>
</template>
