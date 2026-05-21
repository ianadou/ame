<script setup lang="ts">
import { ArrowLeft, Ban } from 'lucide-vue-next'

const route = useRoute()
const sortieId = route.params.id as string

const { annulerSortie } = useSorties()
const notifications = useNotifications()

interface LigneSortie {
  id: string
  articleId: string
  articleReference: string
  articleNom: string
  unite: string
  quantite: number
  prixUnitaire: number
  stockApres: number
}

interface SortieDetail {
  id: string
  reference: string
  clientId: string
  clientNom: string
  clientTelephone: string | null
  clientVille: string | null
  dateSortie: string | null
  objet: string | null
  montantTotal: number
  montantPaye: number
  modeReglement: string
  statutPaiement: string
  notes: string | null
  statut: 'actif' | 'annule'
  annuleLe: string | null
  motifAnnulation: string | null
  createdAt: string
  lignes: LigneSortie[]
}

const { data: sortie, refresh } = await useFetch<SortieDetail>(`/api/sorties/${sortieId}`)

if (!sortie.value) {
  throw createError({ statusCode: 404, message: 'Bon de sortie introuvable' })
}

const paiementMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> =
  {
    paye: { label: 'Payé', variant: 'success' },
    partiel: { label: 'Partiel', variant: 'warning' },
    impaye: { label: 'Impayé', variant: 'neutral' },
  }

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}
function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}
function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const annule = computed(() => sortie.value?.statut === 'annule')

// Modal d'annulation
const showAnnulerModal = ref(false)
const motif = ref('')
const submitting = ref(false)
const motifValide = computed(() => motif.value.trim().length >= 3)

function ouvrirAnnulation() {
  motif.value = ''
  showAnnulerModal.value = true
}

async function confirmerAnnulation() {
  if (!motifValide.value || submitting.value) return
  submitting.value = true
  try {
    const ref = sortie.value?.reference ?? 'Bon'
    await annulerSortie(sortieId, motif.value.trim())
    notifications.success('Bon de sortie annulé', `${ref} — stock restitué`)
    showAnnulerModal.value = false
    await refresh()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Annulation impossible')
        : 'Annulation impossible'
    notifications.danger('Annulation impossible', msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div v-if="sortie" class="space-y-6" :class="annule ? 'opacity-70' : ''">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" @click="navigateTo('/sorties')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ sortie.reference }}</h2>
          <AppBadge v-if="annule" variant="danger" solid>Annulée</AppBadge>
          <AppBadge v-else :variant="paiementMeta[sortie.statutPaiement]?.variant ?? 'neutral'">
            {{ paiementMeta[sortie.statutPaiement]?.label ?? sortie.statutPaiement }}
          </AppBadge>
        </div>
        <p class="text-sm text-muted">
          <NuxtLink :to="`/clients/${sortie.clientId}`" class="hover:text-ink">
            {{ sortie.clientNom }}
          </NuxtLink>
          · {{ formatDate(sortie.dateSortie) }}
          <span v-if="sortie.objet"> · {{ sortie.objet }}</span>
        </p>
      </div>
      <AppButton v-if="!annule" variant="ghost" size="sm" @click="ouvrirAnnulation">
        <Ban class="h-4 w-4" />
        Annuler ce bon
      </AppButton>
    </div>

    <AppCard v-if="annule" class="border-l-4 border-rust">
      <p class="text-sm font-semibold text-rust-dark">
        Bon annulé le {{ formatDateTime(sortie.annuleLe) }}
      </p>
      <p class="mt-1 text-sm text-ink-2">Motif : {{ sortie.motifAnnulation }}</p>
      <p class="mt-2 text-xs text-muted">
        Le stock a été restitué et une transaction d'entrée a été enregistrée pour chaque ligne.
      </p>
    </AppCard>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <AppCard>
        <p class="text-sm text-muted">Montant total</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(sortie.montantTotal) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Payé</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(sortie.montantPaye) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Reste à payer</p>
        <p
          class="text-lg font-semibold"
          :class="sortie.montantTotal - sortie.montantPaye > 0 ? 'text-rust-dark' : 'text-ink'"
        >
          {{ fcfa(sortie.montantTotal - sortie.montantPaye) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Règlement</p>
        <p class="text-lg font-semibold capitalize text-ink">
          {{ sortie.modeReglement.replace('_', ' ') }}
        </p>
      </AppCard>
    </div>

    <AppCard v-if="sortie.notes || sortie.clientTelephone">
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div v-if="sortie.clientTelephone">
          <dt class="text-sm text-muted">Téléphone client</dt>
          <dd class="text-sm text-ink-2">{{ sortie.clientTelephone }}</dd>
        </div>
        <div v-if="sortie.clientVille">
          <dt class="text-sm text-muted">Ville</dt>
          <dd class="text-sm text-ink-2">{{ sortie.clientVille }}</dd>
        </div>
        <div v-if="sortie.notes">
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ sortie.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Articles sortis</h3>
      <AppCard :padding="false">
        <table class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Article</th>
              <th class="text-right">Quantité</th>
              <th class="text-right">Prix unitaire</th>
              <th class="text-right">Sous-total</th>
              <th class="text-right">Stock restant</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in sortie.lignes" :key="l.id" class="border-b border-line/60">
              <td class="px-4 py-3 text-sm font-medium text-ink">{{ l.articleReference }}</td>
              <td class="px-4 py-3 text-sm text-ink-2">{{ l.articleNom }}</td>
              <td class="px-4 py-3 text-right text-sm text-ink-2">
                {{ l.quantite }} {{ l.unite }}
              </td>
              <td class="px-4 py-3 text-right text-sm text-muted">{{ fcfa(l.prixUnitaire) }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-ink">
                {{ fcfa(l.prixUnitaire * l.quantite) }}
              </td>
              <td class="px-4 py-3 text-right text-sm text-muted">{{ l.stockApres }}</td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>

    <AppModal v-model:open="showAnnulerModal" title="Annuler ce bon de sortie">
      <div class="space-y-3">
        <p class="text-sm text-muted">
          L'annulation va restituer le stock article par article et enregistrer une transaction
          d'entrée pour chaque ligne. Cette action est définitive.
        </p>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-ink">
            Motif de l'annulation <span class="text-rust-dark">*</span>
          </label>
          <textarea
            v-model="motif"
            rows="3"
            placeholder="Ex : Erreur de saisie, retour client, livraison annulée…"
            class="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30"
          />
          <p class="mt-1 text-xs text-muted">Minimum 3 caractères.</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showAnnulerModal = false">Retour</AppButton>
        <AppButton
          variant="primary"
          :loading="submitting"
          :disabled="!motifValide"
          @click="confirmerAnnulation"
        >
          Confirmer l'annulation
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
