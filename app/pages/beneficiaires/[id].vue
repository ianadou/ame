<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2, Undo2 } from 'lucide-vue-next'
import type { MaterielDehors } from '~/composables/useRetours'

const route = useRoute()
const beneficiaireId = route.params.id as string

const { updateBeneficiaire, deleteBeneficiaire } = useBeneficiaires()
const { materiel, fetchMaterielDehors } = useRetours()
const notifications = useNotifications()

const showEditModal = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)

interface BonBeneficiaire {
  id: string
  reference: string
  dateSortie: string | null
  objet: string | null
  montantTotal: number
  chantierId: string | null
  chantierNom: string | null
}

interface BeneficiaireDetail {
  id: string
  nom: string
  fonction: string | null
  telephone: string | null
  actif: boolean
  bons: BonBeneficiaire[]
  createdAt: string
}

const { data: beneficiaire, refresh } = await useFetch<BeneficiaireDetail>(
  `/api/beneficiaires/${beneficiaireId}`,
)

if (!beneficiaire.value) {
  throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
}

await fetchMaterielDehors({ beneficiaireId })

const ligneActive = ref<MaterielDehors | null>(null)
const showRetourModal = ref(false)

function ouvrirRetour(ligne: MaterielDehors) {
  ligneActive.value = ligne
  showRetourModal.value = true
}

async function apresRetour() {
  await Promise.all([refresh(), fetchMaterielDehors({ beneficiaireId })])
}

async function handleEdit(data: Record<string, unknown>) {
  try {
    await updateBeneficiaire(beneficiaireId, data)
    showEditModal.value = false
    await refresh()
    notifications.success('Bénéficiaire mis à jour', beneficiaire.value?.nom)
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Mise à jour impossible')
        : 'Mise à jour impossible'
    notifications.danger('Mise à jour impossible', msg)
  }
}

async function handleDelete() {
  showDeleteModal.value = false
  deleting.value = true
  try {
    const nom = beneficiaire.value?.nom ?? 'Bénéficiaire'
    await deleteBeneficiaire(beneficiaireId)
    notifications.success('Bénéficiaire supprimé', nom)
    await navigateTo('/beneficiaires')
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
  <div v-if="beneficiaire" class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton
        variant="ghost"
        size="sm"
        aria-label="Retour"
        @click="navigateTo('/beneficiaires')"
      >
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ beneficiaire.nom }}</h2>
          <AppBadge :variant="metaActif(beneficiaire.actif).variant" solid>
            {{ metaActif(beneficiaire.actif).label }}
          </AppBadge>
        </div>
        <p class="text-sm text-muted">{{ beneficiaire.fonction ?? 'Sans fonction' }}</p>
      </div>
      <div class="flex gap-2">
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

    <AppCard>
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt class="text-sm text-muted">Téléphone</dt>
          <dd class="mono text-sm text-ink-2">{{ beneficiaire.telephone ?? '' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Fonction</dt>
          <dd class="text-sm text-ink-2">{{ beneficiaire.fonction ?? '' }}</dd>
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
              <th>Chantier</th>
              <th>Bon</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="ligne in materiel" :key="ligne.ligneSortieId" class="row-hover">
              <td class="font-medium text-ink">{{ ligne.articleNom }}</td>
              <td class="mono num text-right text-ink-2">{{ ligne.restant }} {{ ligne.unite }}</td>
              <td class="text-muted">{{ ligne.chantierNom ?? '' }}</td>
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
      <h3 class="mb-3 text-sm font-semibold text-ink">Prises de matériel</h3>
      <AppCard :padding="false">
        <table v-if="beneficiaire.bons.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Date</th>
              <th>Chantier</th>
              <th>Objet</th>
              <th class="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="bon in beneficiaire.bons"
              :key="bon.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/sorties/${bon.id}`)"
            >
              <td class="mono text-[12.5px] font-medium text-ink">{{ bon.reference }}</td>
              <td class="mono text-[12.5px] text-muted">{{ formatDate(bon.dateSortie) }}</td>
              <td class="text-muted">{{ bon.chantierNom ?? '' }}</td>
              <td class="text-muted">{{ bon.objet ?? '' }}</td>
              <td class="mono num text-right text-ink-2">{{ fcfa(bon.montantTotal) }}</td>
            </tr>
          </tbody>
        </table>

        <AppEmptyState
          v-else
          title="Aucune prise de matériel"
          description="Les bons où cette personne est renseignée comme « retiré par » apparaîtront ici."
        />
      </AppCard>
    </div>

    <AppModal v-model:open="showEditModal" title="Modifier le bénéficiaire">
      <BeneficiaireForm
        :initial="{
          nom: beneficiaire.nom,
          fonction: beneficiaire.fonction ?? '',
          telephone: beneficiaire.telephone ?? '',
          actif: beneficiaire.actif,
        }"
        @submit="handleEdit"
      >
        <template #actions>
          <AppButton variant="secondary" @click="showEditModal = false">Annuler</AppButton>
          <AppButton type="submit">Enregistrer</AppButton>
        </template>
      </BeneficiaireForm>
    </AppModal>

    <RetourModal v-model:open="showRetourModal" :ligne="ligneActive" @saved="apresRetour" />
    <ConfirmDialog
      v-model:open="showDeleteModal"
      title="Supprimer ce bénéficiaire"
      :cible="beneficiaire.nom"
      message="La fiche est retirée définitivement. Si cette personne figure sur des bons, la suppression est bloquée : désactivez-la plutôt pour conserver l’historique."
      :loading="deleting"
      @confirm="handleDelete"
    />
  </div>
</template>
