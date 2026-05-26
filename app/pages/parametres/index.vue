<script setup lang="ts">
import { Pencil, AlertTriangle } from 'lucide-vue-next'
import type { RegimeTva } from '~/composables/useSessionUser'

const { user, editing, saveRegimeTva } = useSessionUser()
const notifications = useNotifications()

const showConfirm = ref(false)
const busy = ref(false)

const nomEntreprise = computed(() => user.value.nomEntreprise?.trim() || 'Non renseigné')

const tvaSubmitting = ref(false)
async function handleTvaSubmit(regime: RegimeTva, taux: number) {
  tvaSubmitting.value = true
  try {
    await saveRegimeTva(regime, taux)
    notifications.success(
      'Régime fiscal enregistré',
      regime === 'assujetti' ? `Assujetti à la TVA · taux ${taux} %` : 'Non assujetti à la TVA',
    )
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Enregistrement impossible')
        : 'Enregistrement impossible'
    notifications.danger('Enregistrement impossible', msg)
  } finally {
    tvaSubmitting.value = false
  }
}

async function resetData() {
  busy.value = true
  try {
    await $fetch('/api/maintenance/reset', { method: 'POST' })
    showConfirm.value = false
    notifications.success('Données effacées', 'La base est repartie de zéro.')
    await navigateTo('/')
    window.location.reload()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Échec de la réinitialisation')
        : 'Échec de la réinitialisation'
    notifications.danger('Réinitialisation impossible', msg)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <AppCard>
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-sm font-semibold text-ink">Nom de l'entreprise</h3>
          <p class="mt-1 text-sm text-muted">
            Affiché dans le footer de l'application et la signature des documents.
          </p>
          <p class="mt-3 text-[15px] font-medium text-ink">{{ nomEntreprise }}</p>
        </div>
        <AppButton variant="secondary" size="sm" @click="editing = true">
          <Pencil class="h-4 w-4" />
          Modifier
        </AppButton>
      </div>
    </AppCard>

    <AppCard>
      <h3 class="text-sm font-semibold text-ink">Régime fiscal</h3>
      <RegimeTvaForm
        class="mt-4"
        :regime="user.regimeTva"
        :taux="user.tauxTva"
        :submitting="tvaSubmitting"
        @submit="handleTvaSubmit"
        @cancel="() => null"
      />
    </AppCard>

    <AppCard>
      <h3 class="text-sm font-semibold text-ink">Données d'exemple</h3>
      <p class="mt-1 text-sm text-muted">
        L'application est livrée avec des données d'exemple (articles, clients, bons de sortie,
        commandes) pour découvrir l'outil. Quand vous êtes prêt à saisir vos vraies données, effacez
        tout pour repartir d'une base propre. Cette action est irréversible et conserve uniquement
        votre profil.
      </p>
      <div class="mt-4 flex items-center gap-3 rounded-md bg-rust/5 px-4 py-3">
        <AlertTriangle class="h-5 w-5 shrink-0 text-rust" />
        <p class="flex-1 text-[13px] text-rust-dark">
          Effacer définitivement catégories, articles, stock, clients, sorties et commandes.
        </p>
        <AppButton variant="danger" size="sm" @click="showConfirm = true"> Tout effacer </AppButton>
      </div>
    </AppCard>

    <AppModal v-model:open="showConfirm" title="Effacer toutes les données ?">
      <p class="text-[13.5px] text-ink-3">
        Toutes les données métier seront supprimées définitivement. Le nom de votre entreprise est
        conservé. Cette action est irréversible.
      </p>
      <div class="mt-5 flex justify-end gap-3">
        <AppButton variant="secondary" :disabled="busy" @click="showConfirm = false">
          Annuler
        </AppButton>
        <AppButton variant="danger" :disabled="busy" @click="resetData">
          Effacer définitivement
        </AppButton>
      </div>
    </AppModal>
  </div>
</template>
