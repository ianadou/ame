<script setup lang="ts">
import { ArrowLeft, Plus, Scale, Archive, ArchiveRestore } from 'lucide-vue-next'

const route = useRoute()
const articleId = route.params.id as string

const showEntreeModal = ref(false)
const showAjustementModal = ref(false)
const showArchiverModal = ref(false)

interface ArticleMouvement {
  id: string
  type: string
  quantite: number
  fournisseurNom: string | null
  clientNom: string | null
  bonLivraison: string | null
  motif: string | null
  createdAt: string
}

interface ArticleDetail {
  id: string
  reference: string
  nom: string
  categorieId: string | null
  categorieNom: string | null
  unite: string
  prixUnitaire: number | null
  stockActuel: number
  seuilAlerte: number
  emplacement: string | null
  type: 'consommable' | 'equipement'
  retournable: boolean
  notes: string | null
  statut: 'actif' | 'archive'
  archiveLe: string | null
  motifArchivage: string | null
  createdAt: string
  updatedAt: string
  mouvements: ArticleMouvement[]
}

const { data: article, refresh } = await useFetch<ArticleDetail>(`/api/articles/${articleId}`)

if (!article.value) {
  throw createError({ statusCode: 404, message: 'Article introuvable' })
}

function stockStatus(a: { stockActuel: number; seuilAlerte: number }) {
  if (a.stockActuel <= a.seuilAlerte) return 'danger'
  if (a.stockActuel <= a.seuilAlerte * 1.4) return 'warning'
  return 'success'
}

function stockLabel(a: { stockActuel: number; seuilAlerte: number }) {
  if (a.stockActuel <= a.seuilAlerte) return 'Bas'
  if (a.stockActuel <= a.seuilAlerte * 1.4) return 'Limite'
  return 'En stock'
}

const notifications = useNotifications()
const { ajusterStock, archiverArticle, restaurerArticle } = useStock()
const { assujettiTva } = useSessionUser()

const archive = computed(() => article.value?.statut === 'archive')

// Archivage (soft-delete) : modal avec motif obligatoire min 3, action
// inverse (restaurer) sans motif puisque c'est un retour neutre à l'actif.
const motifArchivage = ref('')
const archivageSubmitting = ref(false)
const motifArchivageValide = computed(() => motifArchivage.value.trim().length >= 3)

function ouvrirArchivage() {
  motifArchivage.value = ''
  showArchiverModal.value = true
}

async function confirmerArchivage() {
  if (!motifArchivageValide.value || archivageSubmitting.value) return
  archivageSubmitting.value = true
  try {
    await archiverArticle(articleId, motifArchivage.value.trim())
    notifications.success('Article archivé', article.value?.reference ?? '')
    showArchiverModal.value = false
    await refresh()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Archivage impossible')
        : 'Archivage impossible'
    notifications.danger('Archivage impossible', msg)
  } finally {
    archivageSubmitting.value = false
  }
}

async function confirmerRestauration() {
  try {
    await restaurerArticle(articleId)
    notifications.success('Article restauré', article.value?.reference ?? '')
    await refresh()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Restauration impossible')
        : 'Restauration impossible'
    notifications.danger('Restauration impossible', msg)
  }
}

// Ajustement de stock : champs réactifs + écart calculé en direct.
const stockPhysique = ref<number | null>(null)
const motifAjustement = ref('')
const ajustementSubmitting = ref(false)
const stockTheorique = computed(() => article.value?.stockActuel ?? 0)
const delta = computed(() => {
  if (stockPhysique.value === null || Number.isNaN(stockPhysique.value)) return 0
  return stockPhysique.value - stockTheorique.value
})
const motifAjustementValide = computed(() => motifAjustement.value.trim().length >= 3)
const stockPhysiqueValide = computed(
  () =>
    stockPhysique.value !== null &&
    stockPhysique.value >= 0 &&
    Number.isInteger(stockPhysique.value),
)
const peutAjuster = computed(
  () => stockPhysiqueValide.value && delta.value !== 0 && motifAjustementValide.value,
)

function ouvrirAjustement() {
  stockPhysique.value = stockTheorique.value
  motifAjustement.value = ''
  showAjustementModal.value = true
}

async function confirmerAjustement() {
  if (!peutAjuster.value || ajustementSubmitting.value) return
  ajustementSubmitting.value = true
  try {
    const res = await ajusterStock(articleId, stockPhysique.value!, motifAjustement.value.trim())
    notifications.success(
      'Stock ajusté',
      `${res.delta > 0 ? '+' : ''}${res.delta} ${article.value?.unite ?? ''}, nouveau stock ${res.stockApres}`,
    )
    showAjustementModal.value = false
    await refresh()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Ajustement impossible')
        : 'Ajustement impossible'
    notifications.danger('Ajustement impossible', msg)
  } finally {
    ajustementSubmitting.value = false
  }
}

async function handleMouvement(data: Record<string, unknown>) {
  try {
    await $fetch('/api/mouvements', { method: 'POST', body: data })
    showEntreeModal.value = false
    await refresh()
    notifications.success(
      'Entrée enregistrée',
      `${data.quantite} × ${article.value?.reference ?? ''}`,
    )
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Transaction refusée')
        : 'Transaction refusée'
    notifications.danger('Transaction refusée', msg)
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
function formatDateTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Métadonnées d'affichage par type de transaction (entrée, sortie,
// ajustement positif/négatif). Le sens est positif sauf pour sortie
// et ajustement_negatif → préfixe « − » dans la colonne quantité.
function mvtMeta(type: string): {
  label: string
  variant: 'success' | 'danger' | 'neutral' | 'info'
} {
  if (type === 'entree') return { label: 'Approvisionnement', variant: 'success' }
  if (type === 'sortie') return { label: 'Vente', variant: 'neutral' }
  if (type === 'ajustement_positif') return { label: 'Ajustement +', variant: 'info' }
  if (type === 'ajustement_negatif') return { label: 'Ajustement −', variant: 'info' }
  return { label: type, variant: 'neutral' }
}
function mvtSigne(type: string) {
  return type === 'sortie' || type === 'ajustement_negatif' ? '−' : '+'
}
</script>

<template>
  <div v-if="article" class="space-y-6" :class="archive ? 'opacity-80' : ''">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" @click="navigateTo('/stock')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ article.nom }}</h2>
          <AppBadge v-if="archive" variant="danger" solid>Archivé</AppBadge>
          <AppBadge v-else :variant="stockStatus(article)" solid>{{
            stockLabel(article)
          }}</AppBadge>
        </div>
        <p class="text-sm text-muted">{{ article.reference }}</p>
      </div>
      <div class="flex gap-2">
        <template v-if="!archive">
          <AppButton variant="ghost" size="sm" @click="ouvrirAjustement">
            <Scale class="h-4 w-4" />
            Ajuster le stock
          </AppButton>
          <AppButton variant="secondary" size="sm" @click="showEntreeModal = true">
            <Plus class="h-4 w-4" />
            Approvisionnement
          </AppButton>
          <AppButton variant="ghost" size="sm" @click="ouvrirArchivage">
            <Archive class="h-4 w-4" />
            Archiver
          </AppButton>
        </template>
        <AppButton v-else variant="secondary" size="sm" @click="confirmerRestauration">
          <ArchiveRestore class="h-4 w-4" />
          Restaurer
        </AppButton>
      </div>
    </div>

    <AppCard v-if="archive" class="border-l-4 border-rust">
      <p class="text-sm font-semibold text-rust-dark">
        Article archivé le {{ formatDateTime(article.archiveLe) }}
      </p>
      <p class="mt-1 text-sm text-ink-2">Motif : {{ article.motifArchivage }}</p>
      <p class="mt-2 text-xs text-muted">
        L'article n'apparaît plus dans les sélecteurs de nouveaux bons, commandes ou ajustements.
        Son historique de transactions reste consultable.
      </p>
    </AppCard>

    <!-- Info cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard>
        <p class="text-sm text-muted">Stock actuel</p>
        <p class="text-lg font-semibold text-ink">{{ article.stockActuel }} {{ article.unite }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Seuil d'alerte</p>
        <p class="text-lg font-semibold text-ink">{{ article.seuilAlerte }} {{ article.unite }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">{{ assujettiTva ? 'Prix unitaire HT' : 'Prix unitaire' }}</p>
        <p class="text-lg font-semibold text-ink">
          {{
            article.prixUnitaire
              ? `${article.prixUnitaire.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
              : ''
          }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Catégorie</p>
        <p class="text-lg font-semibold text-ink">{{ article.categorieNom ?? '' }}</p>
      </AppCard>
    </div>

    <!-- Details -->
    <AppCard v-if="article.emplacement || article.notes">
      <dl class="space-y-3">
        <div v-if="article.emplacement">
          <dt class="text-sm text-muted">Emplacement</dt>
          <dd class="text-sm font-medium text-ink">{{ article.emplacement }}</dd>
        </div>
        <div v-if="article.notes">
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ article.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Mouvements history -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Dernières transactions</h3>
      <AppCard :padding="false">
        <table v-if="article.mouvements.length > 0" class="data-table">
          <thead>
            <tr>
              <th class="w-[140px]">Date</th>
              <th class="w-[140px]">Type</th>
              <th class="text-center">Qté</th>
              <th>Origine / Destination</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mvt in article.mouvements" :key="mvt.id" class="row-hover">
              <td class="mono text-[12px] text-ink-3">{{ formatDate(mvt.createdAt) }}</td>
              <td>
                <AppBadge :variant="mvtMeta(mvt.type).variant">
                  {{ mvtMeta(mvt.type).label }}
                </AppBadge>
              </td>
              <td class="mono num text-center text-[14px] font-semibold">
                {{ mvtSigne(mvt.type) }}{{ mvt.quantite }}
              </td>
              <td class="text-ink-2">{{ mvt.fournisseurNom || mvt.clientNom || '' }}</td>
              <td class="text-[12.5px] text-muted">{{ mvt.motif || '' }}</td>
            </tr>
          </tbody>
        </table>
        <AppEmptyState
          v-else
          title="Aucune transaction"
          description="Cet article n'a pas encore de transactions enregistrées."
        />
      </AppCard>
    </div>
    <!-- Mouvement modals -->
    <AppModal v-model:open="showEntreeModal" title="Approvisionnement">
      <MouvementForm
        :article-id="article.id"
        :article-label="`${article.reference} · ${article.nom}`"
        @submit="handleMouvement"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showEntreeModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider l'entrée</AppButton>
        </template>
      </MouvementForm>
    </AppModal>

    <AppModal v-model:open="showArchiverModal" title="Archiver cet article">
      <div class="space-y-3">
        <p class="text-sm text-muted">
          L'article sera retiré des sélecteurs de nouveaux bons, commandes et ajustements. Son
          historique de transactions reste préservé et il peut être restauré à tout moment.
        </p>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-ink">
            Motif de l'archivage <span class="text-rust-dark">*</span>
          </label>
          <textarea
            v-model="motifArchivage"
            rows="3"
            placeholder="Ex : Fin de série, fournisseur arrêté, remplacé par une nouvelle référence…"
            class="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30"
          />
          <p class="mt-1 text-xs text-muted">Minimum 3 caractères.</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showArchiverModal = false">Retour</AppButton>
        <AppButton
          variant="primary"
          :loading="archivageSubmitting"
          :disabled="!motifArchivageValide"
          @click="confirmerArchivage"
        >
          Confirmer l'archivage
        </AppButton>
      </template>
    </AppModal>

    <AppModal v-model:open="showAjustementModal" title="Ajustement de stock">
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Réconcilie le stock théorique avec un comptage physique. Une transaction d'ajustement sera
          inscrite au journal pour traçabilité.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-ink">Stock théorique</label>
            <div
              class="mono num rounded-md border border-line bg-paper-2 px-3 py-2 text-sm text-ink-2"
            >
              {{ stockTheorique }} {{ article.unite }}
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-ink">
              Stock physique constaté <span class="text-rust-dark">*</span>
            </label>
            <input
              v-model.number="stockPhysique"
              type="number"
              min="0"
              step="1"
              class="mono num w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30"
            />
          </div>
        </div>

        <div
          class="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm"
          :class="
            delta > 0
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : delta < 0
                ? 'border-red-200 bg-rust-tint text-rust-dark'
                : 'border-line bg-paper-2 text-muted'
          "
        >
          <span class="font-medium">Écart</span>
          <span class="mono num font-semibold">
            <template v-if="delta > 0">+{{ delta }} {{ article.unite }}</template>
            <template v-else-if="delta < 0">{{ delta }} {{ article.unite }}</template>
            <template v-else>Aucun écart</template>
          </span>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-ink">
            Motif <span class="text-rust-dark">*</span>
          </label>
          <textarea
            v-model="motifAjustement"
            rows="3"
            placeholder="Ex : Inventaire trimestriel, casse non documentée, vol constaté…"
            class="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30"
          />
          <p class="mt-1 text-xs text-muted">Minimum 3 caractères.</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showAjustementModal = false">Retour</AppButton>
        <AppButton
          variant="primary"
          :loading="ajustementSubmitting"
          :disabled="!peutAjuster"
          @click="confirmerAjustement"
        >
          Confirmer l'ajustement
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
