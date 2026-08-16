<script setup lang="ts">
interface BeneficiaireFormData {
  nom: string
  fonction: string
  telephone: string
  actif: boolean
}

const props = defineProps<{
  initial?: Partial<BeneficiaireFormData>
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const form = reactive<BeneficiaireFormData>({
  nom: props.initial?.nom ?? '',
  fonction: props.initial?.fonction ?? '',
  telephone: props.initial?.telephone ?? '',
  actif: props.initial?.actif ?? true,
})

function handleSubmit() {
  if (!form.nom.trim()) return

  const data: Record<string, unknown> = {
    nom: form.nom.trim(),
    actif: form.actif,
  }
  if (form.fonction) data.fonction = form.fonction.trim()
  if (form.telephone) data.telephone = form.telephone.trim()

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.nom" label="Nom complet" placeholder="DIMITRI N'DJA" />
      <AppInput v-model="form.fonction" label="Fonction" placeholder="Chef de chantier" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.telephone" label="Téléphone" placeholder="07 07 07 07 07" />
      <div class="flex items-end">
        <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
          <input
            v-model="form.actif"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span>Actif (peut prendre du matériel)</span>
        </label>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
