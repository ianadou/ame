<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2, Undo2 } from 'lucide-vue-next'
import type { MaterielDehors } from '~/composables/useRetours'

const route = useRoute()
const chantierId = route.params.id as string

const { updateChantier, deleteChantier } = useChantiers()
const { materiel, fetchMaterielDehors } = useRetours()
const notifications = useNotifications()

const showEditModal = ref(false)
const deleting = ref(false)

interface BonChantier {
  id: string
  reference: string
  dateSortie: string | null
  objet: string | null
  montantTotal: number
  statutPaiement: string
  beneficiaireNom: string | null
}

interface ChantierDetail {
  id: string
  nom: string
  ville: string | null
  adresse: string | null
  statut: 'en_cours' | 'termine' | 'pause'
  clientId: string | null
  clientNom: string | null
  budgetAlloue: number | null
  dateDebut: string | null
  dateFinPrevue: string | null
  notes: string | null
  consomme: number
  bons: BonChantier[]
  createdAt: string
  updatedAt: string
}

const { data: chantier, refresh } = await useFetch<ChantierDetail>(`/api/chantiers/${chantierId}`)

if (!chantier.value) {
  throw createError({ statusCode: 404, message: 'Chantier introuvable' })
}

await fetchMaterielDehors({ chantierId })

const statutMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  en_cours: { label: 'En cours', variant: 'success' },
  pause: { label: 'En pause', variant: 'warning' },
  termine: { label: 'Terminé', variant: 'neutral' },
}

const paiementMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> =
  {
    paye: { label: 'Payé', variant: 'success' },
    partiel: { label: 'Partiel', variant: 'warning' },
    impaye: { label: 'Impayé', variant: 'neutral' },
  }

// Part du budget déjà consommée. Sans budget alloué, on n'affiche pas de
// jauge : un pourcentage sur un dénominateur absent n'a pas de sens.
const budget = computed(() => {
  const alloue = chantier.value?.budgetAlloue ?? null
  const consomme = chantier.value?.consomme ?? 0
  if (alloue === null || alloue === 0) return null
  const pct = (consomme / alloue) * 100
  return { alloue, consomme, reste: alloue - consomme, pct, depasse: consomme > alloue }
})

function fcfa(n: number | null) {
  if (n === null) return ''
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA'
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

const ligneActive = ref<MaterielDehors | null>(null)
const showRetourModal = ref(false)

function ouvrirRetour(ligne: MaterielDehors) {
  ligneActive.value = ligne
  showRetourModal.value = true
}

async function apresRetour() {
  await Promise.all([refresh(), fetchMaterielDehors({ chantierId })])
}

async function handleEdit(data: Record<string, unknown>) {
  try {
    await updateChantier(chantierId, data)
    showEditModal.value = false
    await refresh()
    notifications.success('Chantier mis à jour', chantier.value?.nom)
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Mise à jour impossible')
        : 'Mise à jour impossible'
    notifications.danger('Mise à jour impossible', msg)
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    const nom = chantier.value?.nom ?? 'Chantier'
    await deleteChantier(chantierId)
    notifications.success('Chantier supprimé', nom)
    await navigateTo('/chantiers')
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Suppression impossible')
        : 'Suppression impossible'
    notifications.danger('Suppression impossible', msg)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="chantier" class="space-y-6">
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
        <p class="text-sm text-muted">
          {{ [chantier.ville, chantier.clientNom ?? 'Interne'].filter(Boolean).join(' · ') }}
        </p>
      </div>
      <div class="flex gap-2">
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

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <AppCard>
        <p class="text-sm text-muted">Budget alloué</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(chantier.budgetAlloue) || '—' }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Consommé</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(chantier.consomme) }}</p>
        <div v-if="budget" class="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            class="h-full rounded-full"
            :class="budget.depasse ? 'bg-rust' : 'bg-forest'"
            :style="{ width: `${Math.min(100, budget.pct)}%` }"
          />
        </div>
        <p v-if="budget" class="mt-1 text-[11.5px] text-muted">
          {{ Math.round(budget.pct) }} % du budget
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Reste</p>
        <p class="text-lg font-semibold" :class="budget?.depasse ? 'text-rust-dark' : 'text-ink'">
          {{ budget ? fcfa(budget.reste) : '—' }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Bons rattachés</p>
        <p class="text-lg font-semibold text-ink">{{ chantier.bons.length }}</p>
      </AppCard>
    </div>

    <AppCard
      v-if="chantier.adresse || chantier.dateDebut || chantier.dateFinPrevue || chantier.notes"
    >
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div v-if="chantier.adresse">
          <dt class="text-sm text-muted">Adresse</dt>
          <dd class="text-sm text-ink-2">{{ chantier.adresse }}</dd>
        </div>
        <div v-if="chantier.dateDebut">
          <dt class="text-sm text-muted">Début</dt>
          <dd class="text-sm text-ink-2">{{ formatDate(chantier.dateDebut) }}</dd>
        </div>
        <div v-if="chantier.dateFinPrevue">
          <dt class="text-sm text-muted">Fin prévue</dt>
          <dd class="text-sm text-ink-2">{{ formatDate(chantier.dateFinPrevue) }}</dd>
        </div>
        <div v-if="chantier.notes">
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ chantier.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <div v-if="materiel.length > 0">
      <h3 class="mb-3 text-sm font-semibold text-ink">Matériel non retourné</h3>
      <AppCard :padding="false">
        <table class="data-table">
          <thead>
            <tr>
              <th>Article</th>
              <th class="text-right">À rendre</th>
              <th>Retiré par</th>
              <th>Bon</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="ligne in materiel" :key="ligne.ligneSortieId" class="row-hover">
              <td class="font-medium text-ink">{{ ligne.articleNom }}</td>
              <td class="mono num text-right text-ink-2">{{ ligne.restant }} {{ ligne.unite }}</td>
              <td class="text-muted">{{ ligne.beneficiaireNom ?? '—' }}</td>
              <td>
                <NuxtLink
                  :to="`/sorties/${ligne.sortieId}`"
                  class="mono text-[12.5px] text-ink-3 hover:text-ink"
                >
                  {{ ligne.reference }}
                </NuxtLink>
              </td>
              <td class="text-right">
                <AppButton variant="secondary" size="sm" @click="ouvrirRetour(ligne)">
                  <Undo2 class="h-3.5 w-3.5" />
                  Marquer rendu
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Bons rattachés</h3>
      <AppCard :padding="false">
        <table v-if="chantier.bons.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Date</th>
              <th>Objet</th>
              <th>Retiré par</th>
              <th>Paiement</th>
              <th class="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="bon in chantier.bons"
              :key="bon.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/sorties/${bon.id}`)"
            >
              <td class="mono text-[12.5px] font-medium text-ink">{{ bon.reference }}</td>
              <td class="mono text-[12.5px] text-muted">{{ formatDate(bon.dateSortie) }}</td>
              <td class="text-muted">{{ bon.objet ?? '' }}</td>
              <td class="text-muted">{{ bon.beneficiaireNom ?? '—' }}</td>
              <td>
                <AppBadge :variant="paiementMeta[bon.statutPaiement]?.variant ?? 'neutral'">
                  {{ paiementMeta[bon.statutPaiement]?.label ?? bon.statutPaiement }}
                </AppBadge>
              </td>
              <td class="mono num text-right text-ink-2">{{ fcfa(bon.montantTotal) }}</td>
            </tr>
          </tbody>
        </table>

        <AppEmptyState
          v-else
          title="Aucun bon rattaché"
          description="Affectez un chantier lors de la création d'un bon de vente pour suivre ici la consommation et le matériel sorti."
        />
      </AppCard>
    </div>

    <AppModal v-model:open="showEditModal" title="Modifier le chantier">
      <ChantierForm
        :initial="{
          nom: chantier.nom,
          ville: chantier.ville ?? '',
          adresse: chantier.adresse ?? '',
          statut: chantier.statut,
          clientId: chantier.clientId ?? '',
          budgetAlloue: chantier.budgetAlloue !== null ? String(chantier.budgetAlloue) : '',
          dateDebut: chantier.dateDebut ?? '',
          dateFinPrevue: chantier.dateFinPrevue ?? '',
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

    <RetourModal v-model:open="showRetourModal" :ligne="ligneActive" @saved="apresRetour" />
  </div>
</template>
