<script setup lang="ts">
interface CategorieFormData {
  nom: string
  description: string
  parentId: string
}

const props = defineProps<{
  initial?: Partial<CategorieFormData>
  parents?: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const form = reactive<CategorieFormData>({
  nom: props.initial?.nom ?? '',
  description: props.initial?.description ?? '',
  parentId: props.initial?.parentId ?? '',
})

const parentOptions = computed(() => props.parents ?? [])

function handleSubmit() {
  if (!form.nom.trim()) return

  const data: Record<string, unknown> = { nom: form.nom.trim() }
  if (form.description.trim()) data.description = form.description.trim()
  if (form.parentId) data.parentId = form.parentId

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AppInput v-model="form.nom" label="Nom" placeholder="Plomberie" />

    <AppSelect
      v-if="parentOptions.length > 0"
      v-model="form.parentId"
      label="Catégorie parente (optionnel)"
      :options="parentOptions"
      placeholder="Aucune — catégorie racine"
    />

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
      <textarea
        v-model="form.description"
        rows="2"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Description optionnelle..."
      />
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
