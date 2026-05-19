<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2, Minus } from 'lucide-vue-next'

const route = useRoute()
const chantierId = route.params.id as string

const { updateChantier, deleteChantier } = useChantiers()
const notifications = useNotifications()

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
  notifications.success('Chantier mis à jour', chantier.value?.nom)
}

async function handleSortie(data: Record<string, unknown>) {
  try {
    await $fetch('/api/mouvements', { method: 'POST', body: data })
    showSortieModal.value = false
    await refresh()
    notifications.success(
      'Sortie enregistrée',
      `${data.quantite} unité(s) — ${chantier.value?.nom ?? ''}`,
    )
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Transaction refusée')
        : 'Transaction refusée'
    notifications.danger('Sortie refusée', msg)
  }
}

async function handleDelete() {
  deleteError.value = null
  deleting.value = true
  try {
    const nom = chantier.value?.nom ?? 'Chantier'
    await deleteChantier(chantierId)
    notifications.success('Chantier supprimé', nom)
    await navigateTo('/chantiers')
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ??
          'Suppression impossible (transactions liées).')
        : 'Suppression impossible (transactions liées).'
    deleteError.value = msg
    notifications.danger('Suppression impossible', msg)
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
          <h2 class="text-lg font-semibold text-ink">{{ chantier.nom }}</h2>
          <AppBadge :variant="statutMeta[chantier.statut]?.variant ?? 'neutral'">
            {{ statutMeta[chantier.statut]?.label ?? chantier.statut }}
          </AppBadge>
        </div>
        <p class="text-sm text-muted">{{ chantier.adresse ?? 'Aucune adresse renseignée' }}</p>
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

    <p v-if="deleteError" class="rounded-md bg-red-50 px-4 py-3 text-sm text-rust-dark">
      {{ deleteError }}
    </p>

    <!-- Info cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard>
        <p class="text-sm text-muted">Date de début</p>
        <p class="text-lg font-semibold text-ink">{{ formatDate(chantier.dateDebut) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Date de fin</p>
        <p class="text-lg font-semibold text-ink">{{ formatDate(chantier.dateFin) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Articles consommés</p>
        <p class="text-lg font-semibold text-ink">{{ chantier.stockConsomme.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Sorties enregistrées</p>
        <p class="text-lg font-semibold text-ink">{{ chantier.mouvements.length }}</p>
      </AppCard>
    </div>

    <!-- Notes -->
    <AppCard v-if="chantier.notes">
      <dl class="space-y-3">
        <div>
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ chantier.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Stock consommé -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Stock consommé</h3>
      <AppCard :padding="false">
        <table v-if="chantier.stockConsomme.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Article</th>
              <th class="text-right">Quantité consommée</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ligne in chantier.stockConsomme"
              :key="ligne.articleId"
              class="border-b border-line/60"
            >
              <td class="px-4 py-3 text-sm font-medium text-ink">{{ ligne.reference }}</td>
              <td class="px-4 py-3 text-sm text-ink-2">{{ ligne.nom }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-ink">
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
      <h3 class="mb-3 text-sm font-semibold text-ink">Sorties récentes</h3>
      <AppCard :padding="false">
        <table v-if="chantier.mouvements.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Article</th>
              <th class="text-right">Quantité</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mvt in chantier.mouvements" :key="mvt.id" class="border-b border-line/60">
              <td class="px-4 py-3 text-xs text-muted">{{ formatDate(mvt.createdAt) }}</td>
              <td class="px-4 py-3 text-sm text-ink-2">{{ mvt.articleNom ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-ink">
                {{ mvt.quantite }}
              </td>
              <td class="px-4 py-3 text-sm text-muted">{{ mvt.motif ?? '—' }}</td>
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
