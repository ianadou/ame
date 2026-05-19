<script setup lang="ts">
import { ArrowLeft, Plus, Minus } from 'lucide-vue-next'

const route = useRoute()
const articleId = route.params.id as string

const showEntreeModal = ref(false)
const showSortieModal = ref(false)

interface ArticleMouvement {
  id: string
  type: string
  quantite: number
  fournisseurNom: string | null
  chantierNom: string | null
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
  notes: string | null
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

async function handleMouvement(data: Record<string, unknown>) {
  await $fetch('/api/mouvements', { method: 'POST', body: data })
  showEntreeModal.value = false
  showSortieModal.value = false
  await refresh()
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
</script>

<template>
  <div v-if="article" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" @click="navigateTo('/stock')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ article.nom }}</h2>
          <AppBadge :variant="stockStatus(article)">{{ stockLabel(article) }}</AppBadge>
        </div>
        <p class="text-sm text-muted">{{ article.reference }}</p>
      </div>
      <div class="flex gap-2">
        <AppButton variant="secondary" size="sm" @click="showEntreeModal = true">
          <Plus class="h-4 w-4" />
          Entrée
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="showSortieModal = true">
          <Minus class="h-4 w-4" />
          Sortie
        </AppButton>
      </div>
    </div>

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
        <p class="text-sm text-muted">Prix unitaire HT</p>
        <p class="text-lg font-semibold text-ink">
          {{
            article.prixUnitaire
              ? `${article.prixUnitaire.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
              : '—'
          }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Catégorie</p>
        <p class="text-lg font-semibold text-ink">{{ article.categorieNom ?? '—' }}</p>
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
      <h3 class="mb-3 text-sm font-semibold text-ink">Derniers mouvements</h3>
      <AppCard :padding="false">
        <table v-if="article.mouvements.length > 0" class="data-table">
          <thead>
            <tr>
              <th class="w-[140px]">Date</th>
              <th class="w-[100px]">Type</th>
              <th class="text-right">Qté</th>
              <th>Origine / Destination</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mvt in article.mouvements" :key="mvt.id" class="row-hover">
              <td class="mono text-[12px] text-ink-3">{{ formatDate(mvt.createdAt) }}</td>
              <td>
                <AppBadge :variant="mvt.type === 'entree' ? 'success' : 'neutral'">
                  {{ mvt.type === 'entree' ? 'Entrée' : 'Sortie' }}
                </AppBadge>
              </td>
              <td class="mono num text-right text-[14px] font-semibold">
                {{ mvt.type === 'entree' ? '+' : '−' }}{{ mvt.quantite }}
              </td>
              <td class="text-ink-2">{{ mvt.fournisseurNom || mvt.chantierNom || '—' }}</td>
              <td class="text-[12.5px] text-muted">{{ mvt.motif || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <AppEmptyState
          v-else
          title="Aucun mouvement"
          description="Cet article n'a pas encore de mouvements enregistrés."
        />
      </AppCard>
    </div>
    <!-- Mouvement modals -->
    <AppModal v-model:open="showEntreeModal" title="Entrée de stock">
      <MouvementForm
        type="entree"
        :article-id="article.id"
        :article-label="`${article.reference} — ${article.nom}`"
        @submit="handleMouvement"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showEntreeModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider l'entrée</AppButton>
        </template>
      </MouvementForm>
    </AppModal>

    <AppModal v-model:open="showSortieModal" title="Sortie de stock">
      <MouvementForm
        type="sortie"
        :article-id="article.id"
        :article-label="`${article.reference} — ${article.nom}`"
        @submit="handleMouvement"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showSortieModal = false">Annuler</AppButton>
          <AppButton type="submit">Valider la sortie</AppButton>
        </template>
      </MouvementForm>
    </AppModal>
  </div>
</template>
