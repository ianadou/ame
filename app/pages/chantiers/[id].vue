<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const chantierId = route.params.id as string

const { updateChantier, deleteChantier } = useChantiers()
const notifications = useNotifications()

const showEditModal = ref(false)
const deleting = ref(false)

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
  createdAt: string
  updatedAt: string
}

const { data: chantier, refresh } = await useFetch<ChantierDetail>(`/api/chantiers/${chantierId}`)

if (!chantier.value) {
  throw createError({ statusCode: 404, message: 'Chantier introuvable' })
}

const statutMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  en_cours: { label: 'En cours', variant: 'success' },
  pause: { label: 'En pause', variant: 'warning' },
  termine: { label: 'Terminé', variant: 'neutral' },
}

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

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppCard>
        <p class="text-sm text-muted">Budget alloué</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(chantier.budgetAlloue) || '—' }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Début</p>
        <p class="text-lg font-semibold text-ink">{{ formatDate(chantier.dateDebut) || '—' }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Fin prévue</p>
        <p class="text-lg font-semibold text-ink">
          {{ formatDate(chantier.dateFinPrevue) || '—' }}
        </p>
      </AppCard>
    </div>

    <AppCard v-if="chantier.adresse || chantier.notes">
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div v-if="chantier.adresse">
          <dt class="text-sm text-muted">Adresse</dt>
          <dd class="text-sm text-ink-2">{{ chantier.adresse }}</dd>
        </div>
        <div v-if="chantier.notes">
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ chantier.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <p class="text-[12px] text-muted">
      Étape 2 ajoutera ici l'historique des sorties et la consommation budget.
    </p>

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
  </div>
</template>
