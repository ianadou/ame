<script setup lang="ts">
import { ArrowLeft, Trash2, Send, PackageCheck, Ban } from 'lucide-vue-next'

const route = useRoute()
const commandeId = route.params.id as string

const { updateCommande, deleteCommande, receptionner } = useCommandes()
const notifications = useNotifications()

const actionError = ref<string | null>(null)
const busy = ref(false)
const showReception = ref(false)
const recu = reactive<Record<string, string>>({})

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
  tauxTvaApplique: number | null
  createdAt: string
  lignes: LigneCommande[]
  total: number
}

const { data: commande, refresh } = await useFetch<CommandeDetail>(`/api/commandes/${commandeId}`)

if (!commande.value) {
  throw createError({ statusCode: 404, message: 'Commande introuvable' })
}

const peutReceptionner = computed(
  () =>
    commande.value &&
    commande.value.statut !== 'annulee' &&
    commande.value.statut !== 'recue' &&
    commande.value.lignes.some((l) => l.quantiteRecue < l.quantite),
)

function reste(l: LigneCommande) {
  return l.quantite - l.quantiteRecue
}

function openReception(toutRecevoir = false) {
  for (const l of commande.value?.lignes ?? []) {
    recu[l.id] = toutRecevoir ? String(reste(l)) : ''
  }
  showReception.value = true
}

async function changeStatut(statut: string) {
  actionError.value = null
  busy.value = true
  try {
    await updateCommande(commandeId, { statut })
    await refresh()
    const cref = commande.value?.reference ?? ''
    if (statut === 'envoyee') {
      notifications.info(`Commande ${cref} envoyée`, undefined, { desktop: false })
    } else if (statut === 'annulee') {
      notifications.warning(`Commande ${cref} annulée`)
    }
  } catch (e: unknown) {
    actionError.value = e instanceof Error ? e.message : 'Action impossible'
    notifications.danger('Action impossible', actionError.value ?? undefined)
  } finally {
    busy.value = false
  }
}

async function handleReception() {
  actionError.value = null
  const lignes = Object.entries(recu)
    .map(([ligneId, q]) => ({ ligneId, quantite: Number(q) }))
    .filter((l) => l.quantite > 0)
  if (lignes.length === 0) {
    actionError.value = 'Saisissez au moins une quantité reçue.'
    return
  }
  busy.value = true
  try {
    await receptionner(commandeId, lignes)
    showReception.value = false
    await refresh()
    notifications.success(
      `Réception enregistrée · ${commande.value?.reference ?? ''}`,
      'Stock mis à jour, entrées créées.',
    )
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Réception impossible')
        : 'Réception impossible'
    actionError.value = msg
    notifications.danger('Réception impossible', msg)
  } finally {
    busy.value = false
  }
}

async function handleDelete() {
  actionError.value = null
  busy.value = true
  try {
    const cref = commande.value?.reference ?? 'Commande'
    await deleteCommande(commandeId)
    notifications.success('Commande supprimée', cref)
    await navigateTo('/commandes')
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ??
          'Suppression impossible (commande non brouillon).')
        : 'Suppression impossible (commande non brouillon).'
    actionError.value = msg
    notifications.danger('Suppression impossible', msg)
  } finally {
    busy.value = false
  }
}

function formatMontant(montant: number) {
  return `${Math.round(montant).toLocaleString('fr-FR')} FCFA`
}

// Détail TVA si la commande a été créée alors que le régime était
// assujetti : Total HT (= commande.total) / TVA (taux × HT) / Total TTC.
const tva = computed(() => {
  if (!commande.value || commande.value.tauxTvaApplique == null) return null
  const taux = commande.value.tauxTvaApplique
  const ht = commande.value.total
  const montantTva = ht * (taux / 100)
  return { taux, ht, montantTva, ttc: ht + montantTva }
})
</script>

<template>
  <div v-if="commande" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" aria-label="Retour" @click="navigateTo('/commandes')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ commande.reference }}</h2>
          <AppBadge :variant="metaCommande(commande.statut).variant">
            {{ metaCommande(commande.statut).label }}
          </AppBadge>
        </div>
        <p class="text-sm text-muted">{{ commande.fournisseurNom ?? '' }}</p>
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
          v-if="peutReceptionner"
          variant="secondary"
          size="sm"
          :disabled="busy"
          @click="openReception(false)"
        >
          <PackageCheck class="h-4 w-4" />
          Réceptionner
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

    <p v-if="actionError" class="rounded-md bg-rust/10 px-4 py-3 text-sm text-rust-dark">
      {{ actionError }}
    </p>

    <!-- Info cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard>
        <p class="text-sm text-muted">Date de commande</p>
        <p class="text-lg font-semibold text-ink">{{ formatDate(commande.dateCommande) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Livraison prévue</p>
        <p class="text-lg font-semibold text-ink">
          {{ formatDate(commande.dateLivraisonPrevue) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">Lignes</p>
        <p class="text-lg font-semibold text-ink">{{ commande.lignes.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-muted">{{ tva ? 'Total TTC estimé' : 'Total estimé' }}</p>
        <p class="text-lg font-semibold text-ink">
          {{ formatMontant(tva ? tva.ttc : commande.total) }}
        </p>
      </AppCard>
    </div>

    <AppCard v-if="tva">
      <h3 class="mb-3 text-sm font-semibold text-ink">Détail TVA</h3>
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-muted">Total HT</dt>
          <dd class="mono num font-medium text-ink">{{ formatMontant(tva.ht) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted">TVA ({{ tva.taux }} %)</dt>
          <dd class="mono num font-medium text-ink">{{ formatMontant(tva.montantTva) }}</dd>
        </div>
        <div class="flex justify-between border-t border-line pt-2">
          <dt class="font-medium text-ink">Total TTC</dt>
          <dd class="mono num font-semibold text-ink">{{ formatMontant(tva.ttc) }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Notes -->
    <AppCard v-if="commande.notes">
      <dl class="space-y-3">
        <div>
          <dt class="text-sm text-muted">Notes</dt>
          <dd class="text-sm text-ink-2">{{ commande.notes }}</dd>
        </div>
      </dl>
    </AppCard>

    <!-- Lignes -->
    <div>
      <h3 class="mb-3 text-sm font-semibold text-ink">Lignes de la commande</h3>
      <AppCard :padding="false">
        <table class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Article</th>
              <th class="text-center">Commandé</th>
              <th class="text-center">Reçu</th>
              <th class="text-center">Reste</th>
              <th class="text-center">Prix unitaire</th>
              <th class="text-center">Sous-total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ligne in commande.lignes" :key="ligne.id" class="border-b border-line/60">
              <td class="px-4 py-3 text-sm font-medium text-ink">{{ ligne.reference }}</td>
              <td class="px-4 py-3 text-sm text-ink-2">{{ ligne.nom }}</td>
              <td class="px-4 py-3 text-center text-sm text-ink">
                {{ ligne.quantite }} {{ ligne.unite }}
              </td>
              <td class="px-4 py-3 text-center text-sm text-ink-2">{{ ligne.quantiteRecue }}</td>
              <td
                class="px-4 py-3 text-center text-sm font-medium"
                :class="reste(ligne) > 0 ? 'text-rust-dark' : 'text-ink-3'"
              >
                {{ reste(ligne) }}
              </td>
              <td class="px-4 py-3 text-center text-sm text-muted">
                {{ ligne.prixUnitaire ? formatMontant(ligne.prixUnitaire) : '' }}
              </td>
              <td class="px-4 py-3 text-center text-sm font-medium text-ink">
                {{ formatMontant(ligne.quantite * (ligne.prixUnitaire ?? 0)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>

    <!-- Réception modal -->
    <AppModal v-model:open="showReception" title="Réceptionner la commande">
      <div class="space-y-4">
        <div class="flex justify-end">
          <AppButton variant="ghost" size="sm" @click="openReception(true)">
            Tout recevoir
          </AppButton>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Article</th>
                <th class="text-center">Reste</th>
                <th class="text-center">Quantité reçue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ligne in commande.lignes" :key="ligne.id" class="border-b border-line/60">
                <td class="px-4 py-2 text-sm text-ink-2">
                  {{ ligne.reference }} · {{ ligne.nom }}
                </td>
                <td class="px-4 py-2 text-center text-sm text-muted">{{ reste(ligne) }}</td>
                <td class="px-4 py-2">
                  <AppInput
                    v-model="recu[ligne.id]"
                    type="number"
                    align="right"
                    :placeholder="String(reste(ligne))"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-[11px] text-muted">
          La quantité reçue s'ajoute au stock et ne peut pas dépasser le reste à recevoir.
        </p>
        <div class="flex justify-end gap-3 pt-1">
          <AppButton variant="secondary" :disabled="busy" @click="showReception = false">
            Annuler
          </AppButton>
          <AppButton :disabled="busy" @click="handleReception"> Valider la réception </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
