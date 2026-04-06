<script setup lang="ts">
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
    <label v-if="label" class="mb-1 block text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <select
      v-model="model"
      class="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
