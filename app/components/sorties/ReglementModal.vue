<script setup lang="ts">
const props = defineProps<{
  sortieId: string
  reference: string
  clientNom: string
  reste: number
}>()

const emit = defineEmits<{ saved: [] }>()

const open = defineModel<boolean>('open', { required: true })

const { enregistrerReglement } = useCreances()
const notifications = useNotifications()

const montant = ref('')
const mode = ref('especes')
const dateReglement = ref('')
const notes = ref('')
const submitting = ref(false)
const erreur = ref('')

// Pré-rempli avec le solde : le cas courant est un client qui vient tout
// régler. Le montant reste modifiable pour un versement partiel.
watch(open, (ouvert) => {
  if (!ouvert) return
  montant.value = String(Math.round(props.reste))
  mode.value = 'especes'
  dateReglement.value = new Date().toISOString().slice(0, 10)
  notes.value = ''
  erreur.value = ''
})

const montantValide = computed(() => {
  const n = Number(montant.value)
  return n > 0 && n <= props.reste + 0.5
})

const resteApres = computed(() => Math.max(0, props.reste - (Number(montant.value) || 0)))

async function confirmer() {
  if (!montantValide.value || submitting.value) return
  submitting.value = true
  erreur.value = ''

  try {
    await enregistrerReglement(props.sortieId, {
      montant: Number(montant.value),
      dateReglement: dateReglement.value || undefined,
      mode: mode.value,
      notes: notes.value.trim() || undefined,
    })
    notifications.success(
      'Règlement enregistré',
      `${fcfa(Number(montant.value))} sur ${props.reference}`,
    )
    open.value = false
    emit('saved')
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Enregistrement impossible')
        : 'Enregistrement impossible'
    erreur.value = msg
    notifications.danger('Règlement impossible', msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppModal v-model:open="open" title="Enregistrer un règlement">
    <div class="space-y-4">
      <div class="rounded-md bg-paper-2 px-3 py-2.5">
        <p class="text-sm font-medium text-ink">{{ clientNom }}</p>
        <p class="mono mt-0.5 text-[12px] text-muted">{{ reference }}</p>
        <p class="mt-1 text-[12px] text-ink-3">Reste à régler : {{ fcfa(reste) }}</p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="montant" label="Montant reçu (FCFA)" type="number" placeholder="0" />
        <AppInput v-model="dateReglement" label="Date du règlement" type="date" />
      </div>

      <AppSelect v-model="mode" label="Reçu par" :options="OPTIONS_MODE_ENCAISSEMENT" />

      <div>
        <label class="mb-1.5 block text-[12px] font-medium text-ink-2">Notes (optionnel)</label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Ex : versement remis au magasin par le chef de chantier"
          class="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30"
        />
      </div>

      <p v-if="montantValide" class="text-[12px] text-muted">
        Après ce règlement, il restera {{ fcfa(resteApres) }}
        <span v-if="resteApres === 0" class="text-forest-dark">, le bon sera soldé.</span>
      </p>

      <p v-if="erreur" class="rounded-md bg-rust/10 px-3 py-2 text-[12px] text-rust-dark">
        {{ erreur }}
      </p>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="open = false">Annuler</AppButton>
      <AppButton :loading="submitting" :disabled="!montantValide" @click="confirmer">
        Enregistrer
      </AppButton>
    </template>
  </AppModal>
</template>
