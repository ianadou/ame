<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-vue-next'

const route = useRoute()
const clientId = route.params.id as string

const { updateClient, deleteClient } = useClients()
const notifications = useNotifications()

const showEditModal = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

interface SortieHisto {
  id: string
  reference: string
  dateSortie: string | null
  montantTotal: number
  statutPaiement: string
  objet: string | null
  createdAt: string
  nbArticles: number
}

interface ClientDetail {
  id: string
  nom: string
  type: string
  telephone: string | null
  email: string | null
  adresse: string | null
  ville: string | null
  boitePostale: string | null
  ncc: string | null
  notes: string | null
  createdAt: string
  sorties: SortieHisto[]
  totaux: { nbSorties: number; totalAchete: number; totalImpaye: number }
}

const { data: client, refresh } = await useFetch<ClientDetail>(`/api/clients/${clientId}`)

if (!client.value) {
  throw createError({ statusCode: 404, message: 'Client introuvable' })
}

async function handleEdit(data: Record<string, unknown>) {
  await updateClient(clientId, data)
  showEditModal.value = false
  await refresh()
  notifications.success('Client mis à jour', client.value?.nom)
}

async function handleDelete() {
  deleteError.value = null
  showDeleteModal.value = false
  deleting.value = true
  try {
    const nom = client.value?.nom ?? 'Client'
    await deleteClient(clientId)
    notifications.success('Client supprimé', nom)
    await navigateTo('/clients')
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ??
          'Suppression impossible (bons de sortie liés).')
        : 'Suppression impossible (bons de sortie liés).'
    deleteError.value = msg
    notifications.danger('Suppression impossible', msg)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="client" class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" aria-label="Retour" @click="navigateTo('/clients')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ client.nom }}</h2>
          <AppBadge variant="neutral">
            {{ client.type === 'entreprise' ? 'Entreprise' : 'Particulier' }}
          </AppBadge>
        </div>
        <p class="text-sm text-muted">
          {{ [client.telephone, client.ville].filter(Boolean).join(' · ') || 'Aucune coordonnée' }}
        </p>
      </div>
      <div class="flex gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          @click="navigateTo(`/sorties/nouveau?client=${client.id}`)"
        >
          <Plus class="h-4 w-4" />
          Nouvelle vente
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="showEditModal = true">
          <Pencil class="h-4 w-4" />
          Modifier
        </AppButton>
        <AppButton variant="ghost" size="sm" :disabled="deleting" @click="showDeleteModal = true">
          <Trash2 class="h-4 w-4" />
          Supprimer
        </AppButton>
      </div>
    </div>

    <p v-if="deleteError" class="rounded-md bg-rust/10 px-4 py-3 text-sm text-rust-dark">
      {{ deleteError }}
    </p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppCard>
        <p class="text-sm text-muted">Ventes</p>
        <p class="text-lg font-semibold text-ink">{{ client.totaux.nbSorties }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Total acheté</p>
        <p class="text-lg font-semibold text-ink">{{ fcfa(client.totaux.totalAchete) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Reste à payer</p>
        <p
          class="text-lg font-semibold"
          :class="client.totaux.totalImpaye > 0 ? 'text-rust-dark' : 'text-ink'"
        >
          {{ fcfa(client.totaux.totalImpaye) }}
        </p>
      </AppCard>
    </div>

    <AppCard v-if="client.notes || client.adresse || client.email">
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div v-if="client.email">
          <dt class="text-sm text-muted">Email</dt>
          <dd class="text-sm text-ink-2">{{ client.email }}</dd>
        </div>
        <div v-if="client.adresse">
          <dt class="text-sm text-muted">Adresse</dt>
          <dd class="text-sm text-ink-2">{{ client.adresse }}</dd>
        </div>
        <div v-if="client.notes">
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ client.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Historique des bons de sortie</h3>
      <AppCard :padding="false">
        <table v-if="client.sorties.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Date</th>
              <th>Objet</th>
              <th class="text-right">Articles</th>
              <th class="text-right">Montant</th>
              <th>Paiement</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in client.sorties"
              :key="s.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/sorties/${s.id}`)"
            >
              <td class="font-medium">{{ s.reference }}</td>
              <td class="mono text-[12.5px] text-muted">{{ formatDate(s.dateSortie) }}</td>
              <td class="text-muted">{{ s.objet ?? '' }}</td>
              <td class="text-right text-muted">{{ s.nbArticles }}</td>
              <td class="text-right font-medium text-ink">{{ fcfa(s.montantTotal) }}</td>
              <td>
                <AppBadge :variant="metaPaiement(s.statutPaiement).variant">
                  {{ metaPaiement(s.statutPaiement).label }}
                </AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
        <AppEmptyState
          v-else
          title="Aucune vente"
          description="Ce client n'a encore aucun bon de vente enregistré."
        />
      </AppCard>
    </div>

    <AppModal v-model:open="showEditModal" title="Modifier le client">
      <ClientForm
        :initial="{
          nom: client.nom,
          type: client.type,
          telephone: client.telephone ?? '',
          email: client.email ?? '',
          adresse: client.adresse ?? '',
          ville: client.ville ?? '',
          boitePostale: client.boitePostale ?? '',
          ncc: client.ncc ?? '',
          notes: client.notes ?? '',
        }"
        @submit="handleEdit"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showEditModal = false">Annuler</AppButton>
          <AppButton type="submit">Enregistrer</AppButton>
        </template>
      </ClientForm>
    </AppModal>

    <ConfirmDialog
      v-model:open="showDeleteModal"
      title="Supprimer ce client"
      :cible="client.nom"
      message="La fiche est retirée définitivement. Les bons de vente déjà émis à son nom bloquent la suppression et resteront intacts."
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
