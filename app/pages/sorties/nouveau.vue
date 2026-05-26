<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const initialClientId = (route.query.client as string) || undefined

const { createSortie } = useSorties()
const notifications = useNotifications()
const submitting = ref(false)

async function handleSubmit(data: Record<string, unknown>) {
  submitting.value = true
  try {
    const sortie = await createSortie(data)
    notifications.success('Vente enregistrée', sortie.reference)
    await navigateTo(`/sorties/${sortie.id}`)
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Création refusée')
        : 'Création refusée'
    notifications.danger('Vente refusée', msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" size="sm" @click="navigateTo('/sorties')">
        <ArrowLeft class="h-4 w-4" />
      </AppButton>
      <h2 class="text-lg font-semibold text-ink">Nouvelle vente</h2>
    </div>

    <AppCard>
      <SortieForm :initial-client-id="initialClientId" @submit="handleSubmit">
        <template #actions>
          <AppButton variant="secondary" @click="navigateTo('/sorties')">Annuler</AppButton>
          <AppButton type="submit" :disabled="submitting">Valider le bon de vente</AppButton>
        </template>
      </SortieForm>
    </AppCard>
  </div>
</template>
