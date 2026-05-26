<script setup lang="ts">
interface ClientFormData {
  nom: string
  type: string
  telephone: string
  email: string
  adresse: string
  ville: string
  boitePostale: string
  ncc: string
  notes: string
}

const props = defineProps<{
  initial?: Partial<ClientFormData>
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const form = reactive<ClientFormData>({
  nom: props.initial?.nom ?? '',
  type: props.initial?.type ?? 'entreprise',
  telephone: props.initial?.telephone ?? '',
  email: props.initial?.email ?? '',
  adresse: props.initial?.adresse ?? '',
  ville: props.initial?.ville ?? '',
  boitePostale: props.initial?.boitePostale ?? '',
  ncc: props.initial?.ncc ?? '',
  notes: props.initial?.notes ?? '',
})

const typeOptions = [
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'particulier', label: 'Particulier' },
]

function handleSubmit() {
  if (!form.nom.trim()) return

  const data: Record<string, unknown> = {
    nom: form.nom.trim(),
    type: form.type,
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
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput
        v-model="form.nom"
        label="Nom / Raison sociale"
        placeholder="Entreprise Kouassi BTP"
      />
      <AppSelect v-model="form.type" label="Type" :options="typeOptions" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.telephone" label="Téléphone" placeholder="07 07 07 07 07" />
      <AppInput v-model="form.email" label="Email" type="email" placeholder="contact@client.ci" />
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
