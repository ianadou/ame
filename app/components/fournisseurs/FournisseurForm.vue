<script setup lang="ts">
interface FournisseurFormData {
  nom: string
  telephone: string
  email: string
  adresse: string
  ville: string
  boitePostale: string
  ncc: string
  notes: string
}

const props = defineProps<{
  initial?: Partial<FournisseurFormData>
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const form = reactive<FournisseurFormData>({
  nom: props.initial?.nom ?? '',
  telephone: props.initial?.telephone ?? '',
  email: props.initial?.email ?? '',
  adresse: props.initial?.adresse ?? '',
  ville: props.initial?.ville ?? '',
  boitePostale: props.initial?.boitePostale ?? '',
  ncc: props.initial?.ncc ?? '',
  notes: props.initial?.notes ?? '',
})

function handleSubmit() {
  const data: Record<string, unknown> = {
    nom: form.nom,
  }
  if (form.telephone) data.telephone = form.telephone
  if (form.email) data.email = form.email
  if (form.adresse) data.adresse = form.adresse
  if (form.ville) data.ville = form.ville
  if (form.boitePostale) data.boitePostale = form.boitePostale
  if (form.ncc) data.ncc = form.ncc
  if (form.notes) data.notes = form.notes

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AppInput v-model="form.nom" label="Nom" placeholder="Matériaux BTP SARL" />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.telephone" label="Téléphone" placeholder="07 07 07 07 07" />
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="contact@fournisseur.ci"
      />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.adresse" label="Adresse" placeholder="Cocody Riviera 3" />
      <AppInput v-model="form.ville" label="Ville / Commune" placeholder="Abidjan" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput
        v-model="form.boitePostale"
        label="Boîte postale"
        placeholder="01 BP 1234 Abidjan 01"
      />
      <AppInput v-model="form.ncc" label="NCC" placeholder="CI-2023-1234567 X" />
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Notes</label>
      <textarea
        v-model="form.notes"
        rows="2"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Notes optionnelles..."
      />
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
