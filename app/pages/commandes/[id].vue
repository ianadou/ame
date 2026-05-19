<script setup lang="ts">
import { ArrowLeft, Trash2, Send, PackageCheck, Ban } from 'lucide-vue-next'

const route = useRoute()
const commandeId = route.params.id as string

const { updateCommande, deleteCommande } = useCommandes()

const actionError = ref<string | null>(null)
const busy = ref(false)

interface LigneCommande {
  id: string
  articleId: string
  reference: string
  nom: string
  unite: string
  quantite: number
  quantiteRecue: number
  prixUnitaire: number | null
}

interface CommandeDetail {
  id: string
  reference: string
  fournisseurId: string
  fournisseurNom: string | null
  statut: string
  dateCommande: string | null
  dateLivraisonPrevue: string | null
  notes: string | null
  createdAt: string
  lignes: LigneCommande[]
  total: number
}

const { data: commande, refresh } = await useFetch<CommandeDetail>(`/api/commandes/${commandeId}`)

if (!commande.value) {
  throw createError({ statusCode: 404, message: 'Commande introuvable' })
}

const statutMeta: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }
> = {
  brouillon: { label: 'Brouillon', variant: 'neutral' },
  envoyee: { label: 'Envoyée', variant: 'info' },
  recue: { label: 'Reçue', variant: 'success' },
  annulee: { label: 'Annulée', variant: 'danger' },
}

async function changeStatut(statut: string) {
  actionError.value = null
  busy.value = true
  try {
    await updateCommande(commandeId, { statut })
    await refresh()
  } catch (e: unknown) {
    actionError.value = e instanceof Error ? e.message : 'Action impossible'
  } finally {
    busy.value = false
  }
}

async function handleDelete() {
  actionError.value = null
  busy.value = true
  try {
    await deleteCommande(commandeId)
    await navigateTo('/commandes')
  } catch (e: unknown) {
    actionError.value =
      e instanceof Error ? e.message : 'Suppression impossible (commande non brouillon).'
  } finally {
    busy.value = false
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

function formatMontant(montant: number) {
  return `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
}
</script>

<template>
  <div v-if="commande" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" @click="navigateTo('/commandes')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-slate-900">{{ commande.reference }}</h2>
          <AppBadge :variant="statutMeta[commande.statut]?.variant ?? 'neutral'">
            {{ statutMeta[commande.statut]?.label ?? commande.statut }}
          </AppBadge>
        </div>
        <p class="text-sm text-slate-500">{{ commande.fournisseurNom ?? '—' }}</p>
      </div>
      <div class="flex gap-2">
        <AppButton
          v-if="commande.statut === 'brouillon'"
          variant="secondary"
          size="sm"
          :disabled="busy"
          @click="changeStatut('envoyee')"
        >
          <Send class="h-4 w-4" />
          Envoyer
        </AppButton>
        <AppButton
          v-if="commande.statut === 'brouillon' || commande.statut === 'envoyee'"
          variant="secondary"
          size="sm"
          :disabled="busy"
          @click="changeStatut('recue')"
        >
          <PackageCheck class="h-4 w-4" />
          Marquer comme reçue
        </AppButton>
        <AppButton
          v-if="commande.statut === 'brouillon' || commande.statut === 'envoyee'"
          variant="ghost"
          size="sm"
          :disabled="busy"
          @click="changeStatut('annulee')"
        >
          <Ban class="h-4 w-4" />
          Annuler
        </AppButton>
        <AppButton
          v-if="commande.statut === 'brouillon'"
          variant="ghost"
          size="sm"
          :disabled="busy"
          @click="handleDelete"
        >
          <Trash2 class="h-4 w-4" />
          Supprimer
        </AppButton>
      </div>
    </div>

    <p v-if="actionError" class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ actionError }}
    </p>

    <!-- Info cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard>
        <p class="text-sm text-slate-500">Date de commande</p>
        <p class="text-lg font-semibold text-slate-900">{{ formatDate(commande.dateCommande) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Livraison prévue</p>
        <p class="text-lg font-semibold text-slate-900">
          {{ formatDate(commande.dateLivraisonPrevue) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Lignes</p>
        <p class="text-lg font-semibold text-slate-900">{{ commande.lignes.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-slate-500">Total estimé</p>
        <p class="text-lg font-semibold text-slate-900">{{ formatMontant(commande.total) }}</p>
      </AppCard>
    </div>

    <!-- Notes -->
    <AppCard v-if="commande.notes">
      <dl class="space-y-3">
        <div>
          <dt class="text-sm text-slate-500">Notes</dt>
          <dd class="text-sm text-slate-700">{{ commande.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Lignes -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-slate-900">Lignes de la commande</h3>
      <AppCard :padding="false">
        <table class="w-full">
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
                Quantité
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Reçue
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Prix unitaire
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Sous-total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ligne in commande.lignes" :key="ligne.id" class="border-b border-slate-100">
              <td class="px-4 py-3 text-sm font-medium text-slate-900">{{ ligne.reference }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ ligne.nom }}</td>
              <td class="px-4 py-3 text-right text-sm text-slate-900">
                {{ ligne.quantite }} {{ ligne.unite }}
              </td>
              <td class="px-4 py-3 text-right text-sm text-slate-500">{{ ligne.quantiteRecue }}</td>
              <td class="px-4 py-3 text-right text-sm text-slate-500">
                {{ ligne.prixUnitaire ? formatMontant(ligne.prixUnitaire) : '—' }}
              </td>
              <td class="px-4 py-3 text-right text-sm font-medium text-slate-900">
                {{ formatMontant(ligne.quantite * (ligne.prixUnitaire ?? 0)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>
  </div>
</template>
