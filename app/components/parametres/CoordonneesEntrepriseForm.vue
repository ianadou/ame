<script setup lang="ts">
import type { CoordonneesEntreprise } from '~/composables/useSessionUser'

const props = defineProps<{
  initial: CoordonneesEntreprise
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [coordonnees: CoordonneesEntreprise]
}>()

const CHAMPS = ['adresse', 'ville', 'boitePostale', 'telephone', 'ncc', 'rccm'] as const
type Champ = (typeof CHAMPS)[number]

function versFormulaire(coordonnees: CoordonneesEntreprise) {
  return Object.fromEntries(CHAMPS.map((c) => [c, coordonnees[c] ?? ''])) as Record<Champ, string>
}

function depuisFormulaire(): CoordonneesEntreprise {
  return Object.fromEntries(CHAMPS.map((c) => [c, form[c].trim() || null])) as CoordonneesEntreprise
}

const form = reactive(versFormulaire(props.initial))

watch(
  () => props.initial,
  (coordonnees) => Object.assign(form, versFormulaire(coordonnees)),
)

const aChange = computed(() => CHAMPS.some((c) => form[c].trim() !== (props.initial[c] ?? '')))

function valider() {
  if (!aChange.value || props.submitting) return
  emit('submit', depuisFormulaire())
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="valider">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.adresse" label="Adresse" placeholder="Yopougon, zone industrielle" />
      <AppInput v-model="form.ville" label="Ville / Commune" placeholder="Abidjan" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput
        v-model="form.boitePostale"
        label="Boîte postale"
        placeholder="01 BP 1234 Abidjan 01"
      />
      <AppInput v-model="form.telephone" label="Téléphone" placeholder="07 07 07 07 07" />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppInput v-model="form.ncc" label="NCC" placeholder="CI-2023-1234567 X" />
      <AppInput v-model="form.rccm" label="RCCM" placeholder="CI-ABJ-2023-B-12345" />
    </div>

    <div class="flex justify-end pt-2">
      <AppButton type="submit" :loading="submitting" :disabled="!aChange">Enregistrer</AppButton>
    </div>
  </form>
</template>
