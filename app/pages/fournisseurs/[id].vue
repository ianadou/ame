<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const fournisseurId = route.params.id as string

const { updateFournisseur, deleteFournisseur } = useFournisseurs()

const showEditModal = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

interface CommandeLiee {
  id: string
  reference: string
  statut: string
  dateCommande: string | null
  dateLivraisonPrevue: string | null
  createdAt: string
}

interface EntreeLiee {
  id: string
  quantite: number
  articleNom: string | null
  bonLivraison: string | null
  createdAt: string
}

interface FournisseurDetail {
  id: string
  nom: string
  contact: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  notes: string | null
  createdAt: string
  commandes: CommandeLiee[]
  entrees: EntreeLiee[]
}

const { data: fournisseur, refresh } = await useFetch<FournisseurDetail>(
  `/api/fournisseurs/${fournisseurId}`,
)

if (!fournisseur.value) {
  throw createError({ statusCode: 404, message: 'Fournisseur introuvable' })
}

async function handleEdit(data: Record<string, unknown>) {
  await updateFournisseur(fournisseurId, data)
  showEditModal.value = false
  await refresh()
}

async function handleDelete() {
  deleteError.value = null
  deleting.value = true
  try {
    await deleteFournisseur(fournisseurId)
    await navigateTo('/fournisseurs')
  } catch (e: unknown) {
    deleteError.value = e instanceof Error ? e.message : 'Suppression impossible (commandes liées).'
  } finally {
    deleting.value = false
  }
}

function statutVariant(statut: string) {
  if (statut === 'recue') return 'success'
  if (statut === 'annulee') return 'danger'
  if (statut === 'brouillon') return 'neutral'
  return 'info'
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
  <div v-if="fournisseur" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" @click="navigateTo('/fournisseurs')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <h2 class="text-lg font-semibold text-ink">{{ fournisseur.nom }}</h2>
        <p class="text-sm text-muted">{{ fournisseur.contact ?? 'Aucun contact renseigné' }}</p>
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

    <p v-if="deleteError" class="rounded-md bg-red-50 px-4 py-3 text-sm text-rust-dark">
      {{ deleteError }}
    </p>

    <!-- Info cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard>
        <p class="text-sm text-muted">Téléphone</p>
        <p class="text-lg font-semibold text-ink">{{ fournisseur.telephone ?? '—' }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Email</p>
        <p class="truncate text-lg font-semibold text-ink">{{ fournisseur.email ?? '—' }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Commandes</p>
        <p class="text-lg font-semibold text-ink">{{ fournisseur.commandes.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Entrées de stock</p>
        <p class="text-lg font-semibold text-ink">{{ fournisseur.entrees.length }}</p>
      </AppCard>
    </div>

    <!-- Details -->
    <AppCard v-if="fournisseur.adresse || fournisseur.notes">
      <dl class="space-y-3">
        <div v-if="fournisseur.adresse">
          <dt class="text-sm text-muted">Adresse</dt>
          <dd class="text-sm font-medium text-ink">{{ fournisseur.adresse }}</dd>
        </div>
        <div v-if="fournisseur.notes">
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ fournisseur.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Commandes -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Commandes</h3>
      <AppCard :padding="false">
        <table v-if="fournisseur.commandes.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Statut</th>
              <th>Date commande</th>
              <th>Livraison prévue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cmd in fournisseur.commandes" :key="cmd.id" class="border-b border-line/60">
              <td class="px-4 py-3 text-sm font-medium text-ink">{{ cmd.reference }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="statutVariant(cmd.statut)">{{ cmd.statut }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-muted">{{ formatDate(cmd.dateCommande) }}</td>
              <td class="px-4 py-3 text-sm text-muted">
                {{ formatDate(cmd.dateLivraisonPrevue) }}
              </td>
            </tr>
          </tbody>
        </table>
        <AppEmptyState
          v-else
          title="Aucune commande"
          description="Ce fournisseur n'a pas encore de commande enregistrée."
        />
      </AppCard>
    </div>

    <!-- Entrées de stock liées -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Entrées de stock liées</h3>
      <AppCard :padding="false">
        <table v-if="fournisseur.entrees.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Article</th>
              <th class="text-right">Quantité</th>
              <th>Bon de livraison</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entree in fournisseur.entrees"
              :key="entree.id"
              class="border-b border-line/60"
            >
              <td class="px-4 py-3 text-xs text-muted">{{ formatDate(entree.createdAt) }}</td>
              <td class="px-4 py-3 text-sm text-ink-2">{{ entree.articleNom ?? '—' }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-ink">
                {{ entree.quantite }}
              </td>
              <td class="px-4 py-3 text-sm text-muted">{{ entree.bonLivraison ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
        <AppEmptyState
          v-else
          title="Aucune entrée"
          description="Aucune entrée de stock liée à ce fournisseur."
        />
      </AppCard>
    </div>

    <!-- Edit modal -->
    <AppModal v-model:open="showEditModal" title="Modifier le fournisseur">
      <FournisseurForm
        :initial="{
          nom: fournisseur.nom,
          contact: fournisseur.contact ?? '',
          telephone: fournisseur.telephone ?? '',
          email: fournisseur.email ?? '',
          adresse: fournisseur.adresse ?? '',
          notes: fournisseur.notes ?? '',
        }"
        @submit="handleEdit"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showEditModal = false">Annuler</AppButton>
          <AppButton type="submit">Enregistrer</AppButton>
        </template>
      </FournisseurForm>
    </AppModal>
  </div>
</template>
