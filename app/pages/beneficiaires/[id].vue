<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const beneficiaireId = route.params.id as string

const { updateBeneficiaire, deleteBeneficiaire } = useBeneficiaires()
const notifications = useNotifications()

const showEditModal = ref(false)
const deleting = ref(false)

interface BeneficiaireDetail {
  id: string
  nom: string
  fonction: string | null
  telephone: string | null
  actif: boolean
  createdAt: string
}

const { data: beneficiaire, refresh } = await useFetch<BeneficiaireDetail>(
  `/api/beneficiaires/${beneficiaireId}`,
)

if (!beneficiaire.value) {
  throw createError({ statusCode: 404, message: 'Bénéficiaire introuvable' })
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
      <AppButton variant="ghost" size="sm" @click="navigateTo('/beneficiaires')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink">{{ beneficiaire.nom }}</h2>
          <AppBadge :variant="beneficiaire.actif ? 'success' : 'neutral'">
            {{ beneficiaire.actif ? 'Actif' : 'Inactif' }}
          </AppBadge>
        </div>
        <p class="text-sm text-muted">{{ beneficiaire.fonction ?? 'Sans fonction' }}</p>
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

    <AppCard>
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt class="text-sm text-muted">Téléphone</dt>
          <dd class="mono text-sm text-ink-2">{{ beneficiaire.telephone ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Fonction</dt>
          <dd class="text-sm text-ink-2">{{ beneficiaire.fonction ?? '—' }}</dd>
        </div>
      </dl>
    </AppCard>

    <p class="text-[12px] text-muted">
      Étape 2 ajoutera ici l'historique des prises de matériel par cette personne.
    </p>

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
  </div>
</template>
