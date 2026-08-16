<script setup lang="ts">
interface ChantierFormData {
  nom: string
  ville: string
  adresse: string
  statut: 'en_cours' | 'termine' | 'pause'
  clientId: string
  budgetAlloue: string
  dateDebut: string
  dateFinPrevue: string
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
  ville: props.initial?.ville ?? '',
  adresse: props.initial?.adresse ?? '',
  statut: props.initial?.statut ?? 'en_cours',
  clientId: props.initial?.clientId ?? '',
  budgetAlloue: props.initial?.budgetAlloue ?? '',
  dateDebut: props.initial?.dateDebut ?? '',
  dateFinPrevue: props.initial?.dateFinPrevue ?? '',
  notes: props.initial?.notes ?? '',
})

const statutOptions = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'pause', label: 'En pause' },
  { value: 'termine', label: 'Terminé' },
]

const { clients, fetchClients } = useClients()
await fetchClients()

const clientOptions = computed(() => [
  { value: '', label: 'Aucun (chantier interne)' },
  ...clients.value.map((c) => ({ value: c.id, label: c.nom })),
])

function handleSubmit() {
  if (!form.nom.trim()) return

  const data: Record<string, unknown> = {
    nom: form.nom.trim(),
    statut: form.statut,
  }
  if (form.ville) data.ville = form.ville.trim()
  if (form.adresse) data.adresse = form.adresse.trim()
  if (form.clientId) data.clientId = form.clientId
  if (form.budgetAlloue) {
    const n = Number(form.budgetAlloue)
    if (!Number.isNaN(n) && n >= 0) data.budgetAlloue = n
  }
  if (form.dateDebut) data.dateDebut = form.dateDebut
  if (form.dateFinPrevue) data.dateFinPrevue = form.dateFinPrevue
  if (form.notes) data.notes = form.notes.trim()

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.nom" label="Nom du chantier" placeholder="TENGRELA" />
      <AppSelect v-model="form.statut" label="Statut" :options="statutOptions" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.ville" label="Ville" placeholder="Abidjan" />
      <AppInput v-model="form.adresse" label="Adresse / Quartier" placeholder="Cocody Riviera 3" />
    </div>

    <AppSelect
      v-model="form.clientId"
      label="Client (si chantier externe)"
      :options="clientOptions"
    />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppInput
        v-model="form.budgetAlloue"
        label="Budget alloué (FCFA)"
        type="number"
        placeholder="5000000"
      />
      <AppInput v-model="form.dateDebut" label="Date de début" type="date" />
      <AppInput v-model="form.dateFinPrevue" label="Fin prévue" type="date" />
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
