<script setup lang="ts">
interface FournisseurFormData {
  nom: string
  contact: string
  telephone: string
  email: string
  adresse: string
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
  contact: props.initial?.contact ?? '',
  telephone: props.initial?.telephone ?? '',
  email: props.initial?.email ?? '',
  adresse: props.initial?.adresse ?? '',
  notes: props.initial?.notes ?? '',
})

function handleSubmit() {
  const data: Record<string, unknown> = {
    nom: form.nom,
  }
  if (form.contact) data.contact = form.contact
  if (form.telephone) data.telephone = form.telephone
  if (form.email) data.email = form.email
  if (form.adresse) data.adresse = form.adresse
  if (form.notes) data.notes = form.notes

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AppInput v-model="form.nom" label="Nom" placeholder="Matériaux BTP SARL" />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.contact" label="Contact" placeholder="Jean Dupont" />
      <AppInput v-model="form.telephone" label="Téléphone" placeholder="06 12 34 56 78" />
    </div>

    <AppInput
      v-model="form.email"
      label="Email"
      type="email"
      placeholder="contact@fournisseur.fr"
    />

    <AppInput
      v-model="form.adresse"
      label="Adresse"
      placeholder="12 rue des Bâtisseurs, 75000 Paris"
    />

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
