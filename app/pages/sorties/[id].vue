<script setup lang="ts">
import { ArrowLeft, Ban, Wallet, Trash2 } from 'lucide-vue-next'
import type { Reglement } from '~/composables/useCreances'

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
  retournable: boolean
  quantite: number
  prixUnitaire: number
  stockApres: number
  quantiteRetournee: number
}

interface SortieDetail {
  id: string
  reference: string
  clientId: string
  clientNom: string
  clientTelephone: string | null
  clientVille: string | null
  chantierId: string | null
  chantierNom: string | null
  beneficiaireId: string | null
  beneficiaireNom: string | null
  beneficiaireFonction: string | null
  dateSortie: string | null
  dateEcheance: string | null
  objet: string | null
  montantTotal: number
  montantPaye: number
  conditionsReglement: string
  statutPaiement: string
  notes: string | null
  statut: 'actif' | 'annule'
  annuleLe: string | null
  motifAnnulation: string | null
  tauxTvaApplique: number | null
  createdAt: string
  lignes: LigneSortie[]
  reglements: Reglement[]
}

const { data: sortie, refresh } = await useFetch<SortieDetail>(`/api/sorties/${sortieId}`)

if (!sortie.value) {
  throw createError({ statusCode: 404, message: 'Bon de vente introuvable' })
}

const annule = computed(() => sortie.value?.statut === 'annule')

const { supprimerReglement } = useCreances()

const showReglementModal = ref(false)
const reglementASupprimer = ref<Reglement | null>(null)
const suppressionEnCours = ref(false)

async function confirmerSuppressionReglement() {
  if (!reglementASupprimer.value) return
  suppressionEnCours.value = true
  try {
    await supprimerReglement(reglementASupprimer.value.id)
    notifications.success('Règlement supprimé', 'Le statut du bon a été recalculé')
    reglementASupprimer.value = null
    await refresh()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Suppression impossible')
        : 'Suppression impossible'
    notifications.danger('Suppression impossible', msg)
  } finally {
    suppressionEnCours.value = false
  }
}

// La colonne « Rendu » n'a de sens que si le bon porte au moins un
// article retournable, sinon elle serait une colonne de tirets.
const aRetournables = computed(() => (sortie.value?.lignes ?? []).some((l) => l.retournable))

// Si le bon a été émis avec un taux TVA figé (régime assujetti à
// l'époque), on affiche Total HT / TVA / Total TTC ; sinon une seule
// ligne « Total » sans mention TVA. Le montantTotal stocké est interprété
// comme HT côté assujetti, sinon comme net (TTC = HT, pas de TVA).
const tva = computed(() => {
  if (!sortie.value || sortie.value.tauxTvaApplique == null) return null
  const taux = sortie.value.tauxTvaApplique
  const ht = sortie.value.montantTotal
  const montantTva = ht * (taux / 100)
  return { taux, ht, montantTva, ttc: ht + montantTva }
})

// Le TTC fait foi quand un taux TVA a été figé sur le bon : c'est ce que le
// client doit réellement.
const montantDu = computed(() =>
  sortie.value ? (tva.value ? tva.value.ttc : sortie.value.montantTotal) : 0,
)
const reste = computed(() => montantDu.value - (sortie.value?.montantPaye ?? 0))

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
    notifications.success('Vente annulée', `${ref}, stock restitué`)
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
      <AppButton variant="ghost" size="sm" aria-label="Retour" @click="navigateTo('/sorties')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ sortie.reference }}</h2>
          <AppBadge v-if="annule" variant="danger" solid>Annulée</AppBadge>
          <AppBadge v-else :variant="metaPaiement(sortie.statutPaiement).variant" solid>
            {{ metaPaiement(sortie.statutPaiement).label }}
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
      <div class="flex gap-2">
        <AppButton v-if="!annule && reste > 0.5" size="sm" @click="showReglementModal = true">
          <Wallet class="h-4 w-4" />
          Encaisser
        </AppButton>
        <AppButton v-if="!annule" variant="danger" size="sm" @click="ouvrirAnnulation">
          <Ban class="h-4 w-4" />
          Annuler ce bon
        </AppButton>
      </div>
    </div>

    <AppCard v-if="annule" class="border-rust/30 bg-rust/5">
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
        <p class="text-sm text-muted">{{ tva ? 'Total TTC' : 'Montant total' }}</p>
        <p class="text-lg font-semibold text-ink">
          {{ fcfa(tva ? tva.ttc : sortie.montantTotal) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Payé</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(sortie.montantPaye) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Reste à payer</p>
        <p class="text-lg font-semibold" :class="reste > 0.5 ? 'text-rust-dark' : 'text-ink'">
          {{ fcfa(reste) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">{{ sortie.dateEcheance ? 'Échéance' : 'Règlement' }}</p>
        <p class="text-lg font-semibold text-ink">
          {{
            sortie.dateEcheance
              ? formatDate(sortie.dateEcheance)
              : libelleConditions(sortie.conditionsReglement)
          }}
        </p>
        <p v-if="sortie.dateEcheance" class="mt-0.5 text-[11.5px] text-muted">
          {{ libelleConditions(sortie.conditionsReglement) }}
        </p>
      </AppCard>
    </div>

    <AppCard v-if="tva">
      <h3 class="mb-3 text-sm font-semibold text-ink">Détail TVA</h3>
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-muted">Total HT</dt>
          <dd class="mono num font-medium text-ink">{{ fcfa(tva.ht) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted">TVA ({{ tva.taux }} %)</dt>
          <dd class="mono num font-medium text-ink">{{ fcfa(tva.montantTva) }}</dd>
        </div>
        <div class="flex justify-between border-t border-line pt-2">
          <dt class="font-medium text-ink">Total TTC</dt>
          <dd class="mono num font-semibold text-ink">{{ fcfa(tva.ttc) }}</dd>
        </div>
      </dl>
    </AppCard>

    <AppCard
      v-if="sortie.notes || sortie.clientTelephone || sortie.chantierNom || sortie.beneficiaireNom"
    >
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div v-if="sortie.chantierNom">
          <dt class="text-sm text-muted">Chantier</dt>
          <dd class="text-sm text-ink-2">
            <NuxtLink :to="`/chantiers/${sortie.chantierId}`" class="hover:text-ink">
              {{ sortie.chantierNom }}
            </NuxtLink>
          </dd>
        </div>
        <div v-if="sortie.beneficiaireNom">
          <dt class="text-sm text-muted">Retiré par</dt>
          <dd class="text-sm text-ink-2">
            <NuxtLink :to="`/beneficiaires/${sortie.beneficiaireId}`" class="hover:text-ink">
              {{ sortie.beneficiaireNom }}
            </NuxtLink>
            <span v-if="sortie.beneficiaireFonction" class="text-muted">
              · {{ sortie.beneficiaireFonction }}
            </span>
          </dd>
        </div>
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
      <h3 class="mb-3 text-sm font-semibold text-ink">Règlements reçus</h3>
      <AppCard :padding="false">
        <table v-if="sortie.reglements.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reçu par</th>
              <th>Note</th>
              <th class="text-right">Montant</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in sortie.reglements" :key="r.id" class="row-hover">
              <td class="mono text-[12.5px] text-ink-2">{{ formatDate(r.dateReglement) }}</td>
              <td class="text-ink-2">
                {{ libelleEncaissement(r.mode) }}
                <span v-if="r.reference" class="mono ml-2 text-[11.5px] text-muted">
                  {{ r.reference }}
                </span>
              </td>
              <td class="text-[12.5px] text-muted">{{ r.notes ?? '' }}</td>
              <td class="mono num text-right font-medium text-ink">{{ fcfa(r.montant) }}</td>
              <td class="text-right">
                <button
                  v-if="!annule"
                  aria-label="Supprimer ce règlement"
                  title="Supprimer ce règlement"
                  class="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-rust/10 hover:text-rust"
                  @click="reglementASupprimer = r"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <AppEmptyState
          v-else
          :icon="Wallet"
          title="Aucun règlement reçu"
          description="Ce bon n'a encore rien encaissé. Le statut de paiement se calcule à partir des règlements enregistrés ici."
        />
      </AppCard>
    </div>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Articles sortis</h3>
      <AppCard :padding="false">
        <table class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Article</th>
              <th class="text-center">Quantité</th>
              <th class="text-center">Prix unitaire</th>
              <th class="text-center">Sous-total</th>
              <th class="text-center">Stock restant</th>
              <th v-if="aRetournables" class="text-center">Rendu</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in sortie.lignes" :key="l.id" class="border-b border-line/60">
              <td class="px-4 py-3 text-sm font-medium text-ink">{{ l.articleReference }}</td>
              <td class="px-4 py-3 text-sm text-ink-2">{{ l.articleNom }}</td>
              <td class="px-4 py-3 text-center text-sm text-ink-2">
                {{ l.quantite }} {{ l.unite }}
              </td>
              <td class="px-4 py-3 text-center text-sm text-muted">{{ fcfa(l.prixUnitaire) }}</td>
              <td class="px-4 py-3 text-center text-sm font-medium text-ink">
                {{ fcfa(l.prixUnitaire * l.quantite) }}
              </td>
              <td class="px-4 py-3 text-center text-sm text-muted">{{ l.stockApres }}</td>
              <td v-if="aRetournables" class="px-4 py-3 text-center text-sm">
                <span v-if="!l.retournable" class="text-[12px] text-muted">Non retournable</span>
                <AppBadge v-else-if="l.quantiteRetournee >= l.quantite" variant="success">
                  Rendu
                </AppBadge>
                <AppBadge v-else variant="warning">
                  {{ l.quantite - l.quantiteRetournee }} dehors
                </AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>

    <AppModal v-model:open="showAnnulerModal" title="Annuler ce bon de vente">
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
          variant="danger"
          :loading="submitting"
          :disabled="!motifValide"
          @click="confirmerAnnulation"
        >
          Confirmer l'annulation
        </AppButton>
      </template>
    </AppModal>

    <ReglementModal
      v-model:open="showReglementModal"
      :sortie-id="sortie.id"
      :reference="sortie.reference"
      :client-nom="sortie.clientNom"
      :reste="reste"
      @saved="refresh"
    />

    <ConfirmDialog
      :open="reglementASupprimer !== null"
      title="Supprimer ce règlement"
      :cible="
        reglementASupprimer
          ? `${fcfa(reglementASupprimer.montant)} du ${formatDate(reglementASupprimer.dateReglement)}`
          : ''
      "
      message="La ligne disparaît de l'historique et le statut du bon est recalculé. Pour corriger un montant, supprimez la ligne fautive et ressaisissez-en une juste."
      :loading="suppressionEnCours"
      @update:open="(v) => !v && (reglementASupprimer = null)"
      @confirm="confirmerSuppressionReglement"
    />
  </div>
</template>
