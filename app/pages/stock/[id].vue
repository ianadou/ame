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
  if (a.stockActuel === 0) return 'danger'
  if (a.stockActuel <= a.seuilAlerte) return 'warning'
  return 'success'
}

function stockLabel(a: { stockActuel: number; seuilAlerte: number }) {
  if (a.stockActuel === 0) return 'Rupture'
  if (a.stockActuel <= a.seuilAlerte) return 'Stock bas'
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
          <h2 class="text-lg font-semibold text-slate-900">{{ article.nom }}</h2>
          <AppBadge :variant="stockStatus(article)">{{ stockLabel(article) }}</AppBadge>
        </div>
        <p class="text-sm text-slate-500">{{ article.reference }}</p>
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
        <p class="text-sm text-slate-500">Stock actuel</p>
        <p class="text-lg font-semibold text-slate-900">
          {{ article.stockActuel }} {{ article.unite }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Seuil d'alerte</p>
        <p class="text-lg font-semibold text-slate-900">
          {{ article.seuilAlerte }} {{ article.unite }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Prix unitaire HT</p>
        <p class="text-lg font-semibold text-slate-900">
          {{
            article.prixUnitaire
              ? `${article.prixUnitaire.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
              : '—'
          }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Catégorie</p>
        <p class="text-lg font-semibold text-slate-900">{{ article.categorieNom ?? '—' }}</p>
      </AppCard>
    </div>

    <!-- Details -->
    <AppCard v-if="article.emplacement || article.notes">
      <dl class="space-y-3">
        <div v-if="article.emplacement">
          <dt class="text-sm text-slate-500">Emplacement</dt>
          <dd class="text-sm font-medium text-slate-900">{{ article.emplacement }}</dd>
        </div>
        <div v-if="article.notes">
          <dt class="text-sm text-slate-500">Notes</dt>
          <dd class="text-sm text-slate-700">{{ article.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Mouvements history -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-slate-900">Derniers mouvements</h3>
      <AppCard :padding="false">
        <table v-if="article.mouvements.length > 0" class="w-full">
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
                Type
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Quantité
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Origine / Destination
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Motif
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mvt in article.mouvements" :key="mvt.id" class="border-b border-slate-100">
              <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(mvt.createdAt) }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="mvt.type === 'entree' ? 'success' : 'danger'">
                  {{ mvt.type === 'entree' ? 'Entrée' : 'Sortie' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">
                {{ mvt.quantite }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-700">
                {{ mvt.fournisseurNom || mvt.chantierNom || '—' }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ mvt.motif || '—' }}</td>
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
