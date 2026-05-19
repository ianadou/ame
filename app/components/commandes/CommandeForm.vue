<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'

interface LigneForm {
  articleId: string
  quantite: string
  prixUnitaire: string
}

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const fournisseurId = ref('')
const dateCommande = ref('')
const dateLivraisonPrevue = ref('')
const notes = ref('')
const lignes = reactive<LigneForm[]>([{ articleId: '', quantite: '', prixUnitaire: '' }])

const { data: fournisseursData } =
  await useFetch<{ id: string; nom: string }[]>('/api/fournisseurs')
const { data: articlesResult } = await useFetch('/api/articles', {
  query: { limit: 200 },
})

const fournisseurOptions = computed(() =>
  (fournisseursData.value ?? []).map((f) => ({ value: f.id, label: f.nom })),
)

const articleOptions = computed(() => {
  if (!articlesResult.value?.data) return []
  return articlesResult.value.data.map((a: { id: string; reference: string; nom: string }) => ({
    value: a.id,
    label: `${a.reference} — ${a.nom}`,
  }))
})

const total = computed(() =>
  lignes.reduce(
    (sum, ligne) => sum + (Number(ligne.quantite) || 0) * (Number(ligne.prixUnitaire) || 0),
    0,
  ),
)

function addLigne() {
  lignes.push({ articleId: '', quantite: '', prixUnitaire: '' })
}

function removeLigne(index: number) {
  if (lignes.length > 1) lignes.splice(index, 1)
}

function handleSubmit() {
  const data: Record<string, unknown> = {
    fournisseurId: fournisseurId.value,
    lignes: lignes
      .filter((ligne) => ligne.articleId && Number(ligne.quantite) > 0)
      .map((ligne) => {
        const item: Record<string, unknown> = {
          articleId: ligne.articleId,
          quantite: Number(ligne.quantite),
        }
        if (ligne.prixUnitaire) item.prixUnitaire = Number(ligne.prixUnitaire)
        return item
      }),
  }
  if (dateCommande.value) data.dateCommande = dateCommande.value
  if (dateLivraisonPrevue.value) data.dateLivraisonPrevue = dateLivraisonPrevue.value
  if (notes.value) data.notes = notes.value

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AppSelect
      v-model="fournisseurId"
      label="Fournisseur"
      :options="fournisseurOptions"
      placeholder="Sélectionner un fournisseur..."
    />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="dateCommande" label="Date de commande" type="date" />
      <AppInput v-model="dateLivraisonPrevue" label="Livraison prévue" type="date" />
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-slate-700">Lignes</p>
        <AppButton variant="ghost" size="sm" type="button" @click="addLigne">
          <Plus class="h-4 w-4" />
          Ajouter une ligne
        </AppButton>
      </div>
      <div class="space-y-2">
        <div
          v-for="(ligne, index) in lignes"
          :key="index"
          class="grid grid-cols-12 items-end gap-2"
        >
          <div class="col-span-6">
            <AppSelect
              v-model="ligne.articleId"
              :options="articleOptions"
              placeholder="Article..."
            />
          </div>
          <div class="col-span-2">
            <AppInput v-model="ligne.quantite" type="number" placeholder="Qté" />
          </div>
          <div class="col-span-3">
            <AppInput v-model="ligne.prixUnitaire" type="number" placeholder="Prix FCFA" />
          </div>
          <div class="col-span-1 flex justify-center pb-1">
            <button
              type="button"
              class="text-slate-400 hover:text-red-600 disabled:opacity-30"
              :disabled="lignes.length <= 1"
              @click="removeLigne(index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <p class="mt-3 text-right text-sm font-medium text-slate-900">
        Total estimé : {{ total.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) }} FCFA
      </p>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Notes</label>
      <textarea
        v-model="notes"
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
