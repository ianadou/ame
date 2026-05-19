<script setup lang="ts">
interface Category {
  id: string
  nom: string
  children?: { id: string; nom: string }[]
}

interface ArticleFormData {
  reference: string
  nom: string
  categorieId: string
  unite: string
  prixUnitaire: string
  seuilAlerte: string
  emplacement: string
  notes: string
}

const props = defineProps<{
  initial?: Partial<ArticleFormData>
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const form = reactive<ArticleFormData>({
  reference: props.initial?.reference ?? '',
  nom: props.initial?.nom ?? '',
  categorieId: props.initial?.categorieId ?? '',
  unite: props.initial?.unite ?? 'pièce',
  prixUnitaire: props.initial?.prixUnitaire ?? '',
  seuilAlerte: props.initial?.seuilAlerte ?? '5',
  emplacement: props.initial?.emplacement ?? '',
  notes: props.initial?.notes ?? '',
})

const { data: categories } = await useFetch<Category[]>('/api/categories')

const categoryOptions = computed(() => {
  if (!categories.value) return []
  const opts: { value: string; label: string }[] = []
  for (const cat of categories.value) {
    opts.push({ value: cat.id, label: cat.nom })
    if (cat.children) {
      for (const child of cat.children) {
        opts.push({ value: child.id, label: `  ${cat.nom} > ${child.nom}` })
      }
    }
  }
  return opts
})

const uniteOptions = [
  { value: 'pièce', label: 'Pièce' },
  { value: 'mètre', label: 'Mètre' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'litre', label: 'Litre' },
  { value: 'sac', label: 'Sac' },
  { value: 'rouleau', label: 'Rouleau' },
  { value: 'lot', label: 'Lot' },
]

function handleSubmit() {
  const data: Record<string, unknown> = {
    reference: form.reference,
    nom: form.nom,
    unite: form.unite,
  }
  if (form.categorieId) data.categorieId = form.categorieId
  if (form.prixUnitaire) data.prixUnitaire = Number(form.prixUnitaire)
  if (form.seuilAlerte) data.seuilAlerte = Number(form.seuilAlerte)
  if (form.emplacement) data.emplacement = form.emplacement
  if (form.notes) data.notes = form.notes

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.reference" label="Référence" placeholder="PLB-TUY-032" />
      <AppInput v-model="form.nom" label="Nom" placeholder="Tuyau PVC 32mm" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppSelect
        v-model="form.categorieId"
        label="Catégorie"
        :options="categoryOptions"
        placeholder="Sélectionner..."
      />
      <AppSelect v-model="form.unite" label="Unité" :options="uniteOptions" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.prixUnitaire" label="Prix unitaire HT (€)" type="number" placeholder="0.00" />
      <AppInput v-model="form.seuilAlerte" label="Seuil d'alerte" type="number" placeholder="5" />
    </div>

    <AppInput v-model="form.emplacement" label="Emplacement" placeholder="Étagère A3, Rack 2" />

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
