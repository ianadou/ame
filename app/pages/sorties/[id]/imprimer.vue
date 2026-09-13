<script setup lang="ts">
import { ArrowLeft, Printer } from 'lucide-vue-next'
import { useLocalStorage } from '@vueuse/core'
import type { SortieDetail } from '~/composables/useSorties'

// Hors layout : ni sidebar ni footer ne doivent partir à l'impression.
definePageMeta({ layout: false })

const route = useRoute()
const sortieId = route.params.id as string

const { data: sortie } = await useFetch<SortieDetail>(`/api/sorties/${sortieId}`)

if (!sortie.value) {
  throw createError({ statusCode: 404, message: 'Bon de sortie introuvable' })
}

// Sans layout, rien n'a encore chargé l'identité de l'entreprise quand le bon
// est ouvert directement.
const { user: entreprise, loaded, load } = useSessionUser()
if (!loaded.value) await load()

// Sans prix pour le chantier, avec prix pour le client. Le dernier choix est
// retenu : d'un bon à l'autre, c'est en général le même usage.
const afficherPrix = useLocalStorage('ame:bon-sortie:afficher-prix', false)

// Le titre devient le nom proposé pour « Enregistrer en PDF ».
useHead({ title: () => sortie.value?.reference ?? 'Bon de sortie' })

function imprimer() {
  window.print()
}
</script>

<template>
  <div v-if="sortie" class="min-h-screen bg-paper-4 print:bg-white">
    <div class="sticky top-0 z-10 border-b border-line bg-white print:hidden">
      <div class="mx-auto flex max-w-[210mm] flex-wrap items-center gap-3 px-4 py-3">
        <AppButton variant="ghost" size="sm" @click="navigateTo(`/sorties/${sortie.id}`)">
          <ArrowLeft class="h-4 w-4" />
          Retour au bon
        </AppButton>
        <span class="flex-1" />
        <label class="flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
          <input
            v-model="afficherPrix"
            type="checkbox"
            class="h-4 w-4 rounded border-line text-forest focus:ring-forest/30"
          />
          Afficher les prix
        </label>
        <AppButton size="sm" @click="imprimer">
          <Printer class="h-4 w-4" />
          Imprimer
        </AppButton>
      </div>
    </div>

    <div class="overflow-x-auto px-4 py-8 print:overflow-visible print:p-0">
      <BonSortieDocument
        class="mx-auto"
        :sortie="sortie"
        :entreprise="entreprise"
        :afficher-prix="afficherPrix"
      />
    </div>
  </div>
</template>

<style>
@page {
  size: A4;
  margin: 14mm 12mm;
}
</style>
