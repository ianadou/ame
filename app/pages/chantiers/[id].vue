<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2, Minus } from 'lucide-vue-next'

const route = useRoute()
const chantierId = route.params.id as string

const { updateChantier, deleteChantier } = useChantiers()

const showEditModal = ref(false)
const showSortieModal = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

interface StockConsomme {
  articleId: string
  reference: string
  nom: string
  unite: string
  quantiteTotale: number
}

interface MouvementChantier {
  id: string
  quantite: number
  articleNom: string | null
  motif: string | null
  createdAt: string
}

interface ChantierDetail {
  id: string
  nom: string
  adresse: string | null
  statut: string
  dateDebut: string | null
  dateFin: string | null
  notes: string | null
  createdAt: string
  stockConsomme: StockConsomme[]
  mouvements: MouvementChantier[]
}

const { data: chantier, refresh } = await useFetch<ChantierDetail>(`/api/chantiers/${chantierId}`)

if (!chantier.value) {
  throw createError({ statusCode: 404, message: 'Chantier introuvable' })
}

const statutMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  en_cours: { label: 'En cours', variant: 'success' },
  termine: { label: 'Terminé', variant: 'neutral' },
  en_pause: { label: 'En pause', variant: 'warning' },
}

async function handleEdit(data: Record<string, unknown>) {
  await updateChantier(chantierId, data)
  showEditModal.value = false
  await refresh()
}

async function handleSortie(data: Record<string, unknown>) {
  await $fetch('/api/mouvements', { method: 'POST', body: data })
  showSortieModal.value = false
  await refresh()
}

async function handleDelete() {
  deleteError.value = null
  deleting.value = true
  try {
    await deleteChantier(chantierId)
    await navigateTo('/chantiers')
  } catch (e: unknown) {
    deleteError.value = e instanceof Error ? e.message : 'Suppression impossible (mouvements liés).'
  } finally {
    deleting.value = false
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}
</script>

<template>
  <div v-if="chantier" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" @click="navigateTo('/chantiers')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-slate-900">{{ chantier.nom }}</h2>
          <AppBadge :variant="statutMeta[chantier.statut]?.variant ?? 'neutral'">
            {{ statutMeta[chantier.statut]?.label ?? chantier.statut }}
          </AppBadge>
        </div>
        <p class="text-sm text-slate-500">{{ chantier.adresse ?? 'Aucune adresse renseignée' }}</p>
      </div>
      <div class="flex gap-2">
        <AppButton variant="secondary" size="sm" @click="showSortieModal = true">
          <Minus class="h-4 w-4" />
          Sortie de stock
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="showEditModal = true">
          <Pencil class="h-4 w-4" />
          Modifier
        </AppButton>
        <AppButton variant="ghost" size="sm" :disabled="deleting" @click="handleDelete">
          <Trash2 class="h-4 w-4" />
          Supprimer
        </AppButton>
      </div>
    </div>

    <p v-if="deleteError" class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ deleteError }}
    </p>

    <!-- Info cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard>
        <p class="text-sm text-slate-500">Date de début</p>
        <p class="text-lg font-semibold text-slate-900">{{ formatDate(chantier.dateDebut) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Date de fin</p>
        <p class="text-lg font-semibold text-slate-900">{{ formatDate(chantier.dateFin) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Articles consommés</p>
        <p class="text-lg font-semibold text-slate-900">{{ chantier.stockConsomme.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Sorties enregistrées</p>
        <p class="text-lg font-semibold text-slate-900">{{ chantier.mouvements.length }}</p>
      </AppCard>
    </div>

    <!-- Notes -->
    <AppCard v-if="chantier.notes">
      <dl class="space-y-3">
        <div>
          <dt class="text-sm text-slate-500">Notes</dt>
          <dd class="text-sm text-slate-700">{{ chantier.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Stock consommé -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-slate-900">Stock consommé</h3>
      <AppCard :padding="false">
        <table v-if="chantier.stockConsomme.length > 0" class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Référence
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Article
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Quantité consommée
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ligne in chantier.stockConsomme"
              :key="ligne.articleId"
              class="border-b border-slate-100"
            >
              <td class="px-4 py-3 text-sm font-medium text-slate-900">{{ ligne.reference }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ ligne.nom }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">
                {{ ligne.quantiteTotale }} {{ ligne.unite }}
              </td>
            </tr>
          </tbody>
        </table>
        <AppEmptyState
          v-else
          title="Aucun stock consommé"
          description="Aucune sortie de stock n'a encore été enregistrée pour ce chantier."
        />
      </AppCard>
    </div>

    <!-- Sorties récentes -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-slate-900">Sorties récentes</h3>
      <AppCard :padding="false">
        <table v-if="chantier.mouvements.length > 0" class="w-full">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Date
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Article
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Quantité
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Motif
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mvt in chantier.mouvements" :key="mvt.id" class="border-b border-slate-100">
              <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(mvt.createdAt) }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ mvt.articleNom ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">
                {{ mvt.quantite }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ mvt.motif ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
        <AppEmptyState
          v-else
          title="Aucune sortie"
          description="Aucune sortie de stock enregistrée pour ce chantier."
        />
      </AppCard>
    </div>

    <!-- Sortie modal -->
    <AppModal v-model:open="showSortieModal" title="Sortie de stock pour ce chantier">
      <MouvementForm
        type="sortie"
        :chantier-id="chantier.id"
        :chantier-label="chantier.nom"
        @submit="handleSortie"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showSortieModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider la sortie</AppButton>
        </template>
      </MouvementForm>
    </AppModal>

    <!-- Edit modal -->
    <AppModal v-model:open="showEditModal" title="Modifier le chantier">
      <ChantierForm
        :initial="{
          nom: chantier.nom,
          adresse: chantier.adresse ?? '',
          statut: chantier.statut,
          dateDebut: chantier.dateDebut ?? '',
          dateFin: chantier.dateFin ?? '',
          notes: chantier.notes ?? '',
        }"
        @submit="handleEdit"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showEditModal = false">Annuler</AppButton>
          <AppButton type="submit">Enregistrer</AppButton>
        </template>
      </ChantierForm>
    </AppModal>
  </div>
</template>
