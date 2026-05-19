<script setup lang="ts">
interface Props {
  type: 'entree' | 'sortie'
  articleId?: string
  articleLabel?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const searchQuery = ref('')
const selectedArticleId = ref(props.articleId ?? '')
const quantite = ref('')
const fournisseurId = ref('')
const chantierId = ref('')
const bonLivraison = ref('')
const motif = ref('')

const { data: articlesResult } = await useFetch('/api/articles', {
  query: { search: searchQuery, limit: 10 },
  watch: [searchQuery],
})

const { data: fournisseursData } =
  await useFetch<{ id: string; nom: string }[]>('/api/fournisseurs')
const { data: chantiersData } = await useFetch<{ id: string; nom: string }[]>('/api/chantiers')

const articleOptions = computed(() => {
  if (!articlesResult.value?.data) return []
  return articlesResult.value.data.map((a: { id: string; reference: string; nom: string }) => ({
    value: a.id,
    label: `${a.reference} — ${a.nom}`,
  }))
})

const fournisseurOptions = computed(() =>
  (fournisseursData.value ?? []).map((f) => ({ value: f.id, label: f.nom })),
)

const chantierOptions = computed(() =>
  (chantiersData.value ?? []).map((c) => ({ value: c.id, label: c.nom })),
)

function handleSubmit() {
  const data: Record<string, unknown> = {
    articleId: selectedArticleId.value,
    type: props.type,
    quantite: Number(quantite.value),
  }
  if (fournisseurId.value) data.fournisseurId = fournisseurId.value
  if (chantierId.value) data.chantierId = chantierId.value
  if (bonLivraison.value) data.bonLivraison = bonLivraison.value
  if (motif.value) data.motif = motif.value

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div v-if="!articleId">
      <AppSelect
        v-model="selectedArticleId"
        label="Article"
        :options="articleOptions"
        placeholder="Sélectionner un article..."
      />
    </div>
    <div v-else>
      <p class="mb-1 text-sm font-medium text-slate-700">Article</p>
      <p class="text-sm text-slate-900">{{ articleLabel }}</p>
    </div>

    <AppInput v-model="quantite" label="Quantité" type="number" placeholder="0" />

    <AppSelect
      v-if="type === 'entree'"
      v-model="fournisseurId"
      label="Fournisseur"
      :options="fournisseurOptions"
      placeholder="Optionnel..."
    />

    <AppSelect
      v-if="type === 'sortie'"
      v-model="chantierId"
      label="Chantier"
      :options="chantierOptions"
      placeholder="Optionnel..."
    />

    <AppInput
      v-if="type === 'entree'"
      v-model="bonLivraison"
      label="Bon de livraison"
      placeholder="N° du bon..."
    />

    <AppInput v-model="motif" label="Motif" placeholder="Raison du mouvement..." />

    <div class="flex justify-end gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
