<script setup lang="ts">
interface Props {
  label?: string
  error?: string
  placeholder?: string
  type?: string
}

withDefaults(defineProps<Props>(), {
  label: undefined,
  error: undefined,
  placeholder: undefined,
  type: 'text',
})

const model = defineModel<string>()
</script>

<template>
  <div>
    <label v-if="label" class="mb-1 block text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <input
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      class="h-9 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': error }"
    />
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
