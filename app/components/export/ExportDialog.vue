<script setup lang="ts">
import { Download } from 'lucide-vue-next'

const props = defineProps<{
  entites: { value: string; label: string }[]
}>()

const open = defineModel<boolean>('open', { default: false })

const { telecharger } = useExport()

const entite = ref(props.entites[0]?.value ?? '')
const format = ref<'csv' | 'xlsx'>('xlsx')
const categorie = ref('')
const typeMvt = ref('')

watch(open, (v) => {
  if (v) {
    entite.value = props.entites[0]?.value ?? ''
    format.value = 'xlsx'
    categorie.value = ''
    typeMvt.value = ''
  }
})

const { data: categories } = await useFetch<{ id: string; nom: string }[]>('/api/categories')

const optionsCategorie = computed(() => [
  { value: '', label: 'Toutes les catégories' },
  ...(categories.value ?? []).map((c) => ({ value: c.id, label: c.nom })),
])

const optionsFormat = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
]

const optionsType = [
  { value: '', label: 'Toutes les transactions' },
  { value: 'entree', label: 'Entrées seulement' },
  { value: 'sortie', label: 'Sorties seulement' },
]

function lancer() {
  telecharger(entite.value, format.value, {
    categorie: entite.value === 'articles' ? categorie.value || undefined : undefined,
    type: entite.value === 'mouvements' ? typeMvt.value || undefined : undefined,
  })
  open.value = false
}
</script>

<template>
  <AppModal v-model:open="open" title="Exporter des données">
    <div class="space-y-4">
      <AppSelect
        v-if="entites.length > 1"
        v-model="entite"
        label="Type de données"
        :options="entites"
      />

      <AppSelect
        v-if="entite === 'articles'"
        v-model="categorie"
        label="Catégorie"
        :options="optionsCategorie"
      />

      <AppSelect
        v-if="entite === 'mouvements'"
        v-model="typeMvt"
        label="Filtre"
        :options="optionsType"
      />

      <AppSelect v-model="format" label="Format" :options="optionsFormat" />
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="open = false">Annuler</AppButton>
      <AppButton @click="lancer">
        <Download class="h-4 w-4" />
        Exporter
      </AppButton>
    </template>
  </AppModal>
</template>
