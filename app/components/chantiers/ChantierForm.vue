<script setup lang="ts">
interface ChantierFormData {
  nom: string
  adresse: string
  statut: string
  dateDebut: string
  dateFin: string
  notes: string
}

const props = defineProps<{
  initial?: Partial<ChantierFormData>
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const form = reactive<ChantierFormData>({
  nom: props.initial?.nom ?? '',
  adresse: props.initial?.adresse ?? '',
  statut: props.initial?.statut ?? 'en_cours',
  dateDebut: props.initial?.dateDebut ?? '',
  dateFin: props.initial?.dateFin ?? '',
  notes: props.initial?.notes ?? '',
})

const statutOptions = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'en_pause', label: 'En pause' },
]

function handleSubmit() {
  const data: Record<string, unknown> = {
    nom: form.nom,
    statut: form.statut,
  }
  if (form.adresse) data.adresse = form.adresse
  if (form.dateDebut) data.dateDebut = form.dateDebut
  if (form.dateFin) data.dateFin = form.dateFin
  if (form.notes) data.notes = form.notes

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AppInput v-model="form.nom" label="Nom" placeholder="Chantier Cocody Riviera" />

    <AppInput v-model="form.adresse" label="Adresse" placeholder="Cocody Riviera 3, Abidjan" />

    <AppSelect v-model="form.statut" label="Statut" :options="statutOptions" />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.dateDebut" label="Date de début" type="date" />
      <AppInput v-model="form.dateFin" label="Date de fin" type="date" />
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
