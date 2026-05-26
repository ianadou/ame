<script setup lang="ts">
import type { RegimeTva } from '~/composables/useSessionUser'

const props = defineProps<{
  regime: RegimeTva
  taux: number
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [regime: RegimeTva, taux: number]
  cancel: []
}>()

const regime = ref<RegimeTva>(props.regime)
const taux = ref<number>(props.taux)

watch(
  () => [props.regime, props.taux] as const,
  ([r, t]) => {
    regime.value = r
    taux.value = t
  },
)

const tauxValide = computed(() => Number.isFinite(taux.value) && taux.value >= 0 && taux.value <= 30)
const peutValider = computed(
  () => regime.value === 'non_assujetti' || tauxValide.value,
)
const aChange = computed(() => regime.value !== props.regime || taux.value !== props.taux)

function valider() {
  if (!peutValider.value || props.submitting) return
  emit('submit', regime.value, regime.value === 'assujetti' ? taux.value : props.taux)
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Définit l'affichage TVA sur les bons de sortie et commandes. Les bons déjà créés conservent
      le taux figé à leur émission.
    </p>

    <div class="space-y-2">
      <label class="flex cursor-pointer items-start gap-3 rounded-md border border-line px-3 py-2.5 hover:bg-paper-2">
        <input
          v-model="regime"
          type="radio"
          value="non_assujetti"
          class="mt-0.5"
        />
        <div class="flex-1">
          <p class="text-sm font-medium text-ink">Non assujetti à la TVA</p>
          <p class="mt-0.5 text-[12px] text-muted">
            Aucune mention TVA sur les bons. Cas par défaut (microentreprise, impôt synthétique).
          </p>
        </div>
      </label>

      <label class="flex cursor-pointer items-start gap-3 rounded-md border border-line px-3 py-2.5 hover:bg-paper-2">
        <input
          v-model="regime"
          type="radio"
          value="assujetti"
          class="mt-0.5"
        />
        <div class="flex-1">
          <p class="text-sm font-medium text-ink">Assujetti à la TVA</p>
          <p class="mt-0.5 text-[12px] text-muted">
            Les bons affichent Total HT, TVA et Total TTC. Les prix saisis sont en HT.
          </p>
        </div>
      </label>
    </div>

    <div v-if="regime === 'assujetti'">
      <label class="mb-1.5 block text-sm font-medium text-ink">
        Taux de TVA (%) <span class="text-rust-dark">*</span>
      </label>
      <input
        v-model.number="taux"
        type="number"
        min="0"
        max="30"
        step="0.5"
        class="mono num w-32 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30"
      />
      <p class="mt-1 text-xs text-muted">
        Côte d'Ivoire : 18 % (taux normal) ou 9 % (taux réduit sur certains biens).
      </p>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <AppButton variant="secondary" :disabled="submitting" @click="emit('cancel')">
        Annuler
      </AppButton>
      <AppButton
        variant="primary"
        :loading="submitting"
        :disabled="!peutValider || !aChange"
        @click="valider"
      >
        Enregistrer
      </AppButton>
    </div>
  </div>
</template>
