<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  label?: string
  error?: string
  placeholder?: string
  type?: string
  icon?: Component
  mono?: boolean
  align?: 'left' | 'right'
}

withDefaults(defineProps<Props>(), { type: 'text', align: 'left' })
const model = defineModel<string>()
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-[12px] font-medium text-ink-2">
      {{ label }}
    </label>
    <div
      class="flex items-center rounded-md border border-line bg-white transition-all focus-within:border-ink-4 focus-within:shadow-soft"
      :class="{ '!border-rust focus-within:!border-rust': error }"
    >
      <span v-if="icon" class="pl-3 text-muted">
        <component :is="icon" class="h-[15px] w-[15px]" />
      </span>
      <input
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        class="h-9 w-full rounded-md bg-transparent pr-3 text-[13px] text-ink placeholder:text-muted/80 focus:outline-none"
        :class="[icon ? 'pl-2' : 'pl-3', mono ? 'mono' : '', align === 'right' ? 'text-right' : '']"
      />
    </div>
    <p v-if="error" class="mt-1 text-[11px] text-rust-dark">{{ error }}</p>
  </div>
</template>
