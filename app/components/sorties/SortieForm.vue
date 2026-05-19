<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import type { Client } from '~/composables/useClients'

interface ArticleOption {
  id: string
  reference: string
  nom: string
  prixUnitaire: number | null
  stockActuel: number
  unite: string
}

const props = defineProps<{
  initialClientId?: string
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const { data: clientsResp } = await useFetch<Client[]>('/api/clients')
const { data: articlesResp } = await useFetch<{ data: ArticleOption[] }>('/api/articles', {
  query: { limit: 100 },
})

const clientOptions = computed(() =>
  (clientsResp.value ?? []).map((c) => ({ value: c.id, label: c.nom })),
)
const articles = computed(() => articlesResp.value?.data ?? [])
const articleOptions = computed(() =>
  articles.value.map((a) => ({ value: a.id, label: `${a.reference} — ${a.nom}` })),
)

const form = reactive({
  clientId: props.initialClientId ?? '',
  dateSortie: new Date().toISOString().slice(0, 10),
  objet: '',
  modeReglement: 'comptant',
  statutPaiement: 'paye',
  montantPaye: '',
  notes: '',
})

const lignes = ref<{ articleId: string; quantite: string }[]>([{ articleId: '', quantite: '1' }])

const modeOptions = [
  { value: 'comptant', label: 'Comptant' },
  { value: 'credit', label: 'Crédit' },
  { value: 'mobile_money', label: 'Mobile money' },
]
const statutOptions = [
  { value: 'paye', label: 'Payé' },
  { value: 'partiel', label: 'Partiel' },
  { value: 'impaye', label: 'Impayé' },
]

function articleById(id: string) {
  return articles.value.find((a) => a.id === id)
}

const total = computed(() =>
  lignes.value.reduce((s, l) => {
    const a = articleById(l.articleId)
    return s + (a?.prixUnitaire ?? 0) * (Number(l.quantite) || 0)
  }, 0),
)

function addLigne() {
  lignes.value.push({ articleId: '', quantite: '1' })
}
function removeLigne(i: number) {
  lignes.value.splice(i, 1)
  if (lignes.value.length === 0) addLigne()
}

const erreur = ref('')

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

function handleSubmit() {
  erreur.value = ''
  if (!form.clientId) {
    erreur.value = 'Sélectionnez un client.'
    return
  }
  const lignesValides = lignes.value
    .filter((l) => l.articleId && Number(l.quantite) > 0)
    .map((l) => ({ articleId: l.articleId, quantite: Number(l.quantite) }))
  if (lignesValides.length === 0) {
    erreur.value = 'Ajoutez au moins un article avec une quantité.'
    return
  }
  for (const l of lignesValides) {
    const a = articleById(l.articleId)
    if (a && l.quantite > a.stockActuel) {
      erreur.value = `Stock insuffisant pour « ${a.nom} » (${a.stockActuel} disponible).`
      return
    }
  }

  const data: Record<string, unknown> = {
    clientId: form.clientId,
    dateSortie: form.dateSortie || undefined,
    modeReglement: form.modeReglement,
    statutPaiement: form.statutPaiement,
    lignes: lignesValides,
  }
  if (form.objet) data.objet = form.objet
  if (form.notes) data.notes = form.notes
  if (form.statutPaiement === 'partiel' && form.montantPaye) {
    data.montantPaye = Number(form.montantPaye)
  }

  emit('submit', data)
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppSelect
        v-model="form.clientId"
        label="Client"
        :options="clientOptions"
        placeholder="Sélectionner un client..."
      />
      <AppInput v-model="form.dateSortie" label="Date de sortie" type="date" />
    </div>

    <AppInput
      v-model="form.objet"
      label="Objet (optionnel)"
      placeholder="Livraison Cocody Riviera"
    />

    <!-- Lignes -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-[12px] font-medium text-ink-2">Articles sortis</label>
        <button
          type="button"
          class="flex items-center gap-1 text-[12px] font-medium text-primary-600 hover:text-primary-700"
          @click="addLigne"
        >
          <Plus class="h-3.5 w-3.5" /> Ajouter une ligne
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(ligne, i) in lignes"
          :key="i"
          class="grid grid-cols-[1fr_88px_auto] items-end gap-2"
        >
          <AppSelect v-model="ligne.articleId" :options="articleOptions" placeholder="Article..." />
          <AppInput v-model="ligne.quantite" type="number" placeholder="Qté" />
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-rust/10 hover:text-rust"
            title="Retirer"
            @click="removeLigne(i)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
          <p v-if="ligne.articleId" class="col-span-3 -mt-1 text-[11px] text-muted">
            {{ articleById(ligne.articleId)?.stockActuel ?? 0 }}
            {{ articleById(ligne.articleId)?.unite }} en stock ·
            {{ fcfa(articleById(ligne.articleId)?.prixUnitaire ?? 0) }} / u · sous-total
            {{
              fcfa(
                (articleById(ligne.articleId)?.prixUnitaire ?? 0) * (Number(ligne.quantite) || 0),
              )
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Règlement -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppSelect v-model="form.modeReglement" label="Mode de règlement" :options="modeOptions" />
      <AppSelect v-model="form.statutPaiement" label="Statut paiement" :options="statutOptions" />
      <AppInput
        v-if="form.statutPaiement === 'partiel'"
        v-model="form.montantPaye"
        label="Montant payé (FCFA)"
        type="number"
        placeholder="0"
      />
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

    <div class="flex items-center justify-between border-t border-line pt-3">
      <span class="text-[13px] text-muted">Total du bon</span>
      <span class="text-[18px] font-semibold text-ink">{{ fcfa(total) }}</span>
    </div>

    <p v-if="erreur" class="rounded-md bg-rust/10 px-3 py-2 text-[12px] text-rust-dark">
      {{ erreur }}
    </p>

    <div class="flex justify-end gap-3 pt-1">
      <slot name="actions" />
    </div>
  </form>
</template>
