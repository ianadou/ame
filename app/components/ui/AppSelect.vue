<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

defineProps<Props>()
const model = defineModel<string>()
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-[12px] font-medium text-ink-2">
      {{ label }}
    </label>
    <div
      class="relative flex items-center rounded-md border border-line bg-white transition-colors hover:border-line-2 focus-within:border-ink-4"
      :class="{ '!border-rust': error }"
    >
      <select
        v-model="model"
        class="h-9 w-full cursor-pointer appearance-none rounded-md bg-transparent pl-3 pr-9 text-[13px] text-ink focus:outline-none"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <span class="pointer-events-none absolute right-2.5 text-muted">
        <ChevronDown class="h-3.5 w-3.5" />
      </span>
    </div>
    <p v-if="error" class="mt-1 text-[11px] text-rust-dark">{{ error }}</p>
  </div>
</template>
