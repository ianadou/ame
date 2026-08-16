<script setup lang="ts">
import type { MaterielDehors } from '~/composables/useRetours'

const props = defineProps<{ ligne: MaterielDehors | null }>()
const emit = defineEmits<{ saved: [] }>()

const open = defineModel<boolean>('open', { required: true })

const { enregistrerRetour } = useRetours()
const notifications = useNotifications()

const quantite = ref('')
const etat = ref<'bon' | 'endommage'>('bon')
const dateRetour = ref('')
const notes = ref('')
const submitting = ref(false)
const erreur = ref('')

const etatOptions = [
  { value: 'bon', label: 'Bon état, remis en stock' },
  { value: 'endommage', label: 'Endommagé, non remis en stock' },
]

// Réinitialise à chaque ouverture : on pré-remplit avec le reste dû, cas
// le plus fréquent (le bénéficiaire ramène tout d'un coup).
watch(open, (ouvert) => {
  if (!ouvert) return
  quantite.value = String(props.ligne?.restant ?? 1)
  etat.value = 'bon'
  dateRetour.value = new Date().toISOString().slice(0, 10)
  notes.value = ''
  erreur.value = ''
})

const quantiteValide = computed(() => {
  const n = Number(quantite.value)
  return Number.isInteger(n) && n > 0 && n <= (props.ligne?.restant ?? 0)
})

async function confirmer() {
  if (!props.ligne || !quantiteValide.value || submitting.value) return
  submitting.value = true
  erreur.value = ''

  try {
    await enregistrerRetour({
      ligneSortieId: props.ligne.ligneSortieId,
      quantite: Number(quantite.value),
      dateRetour: dateRetour.value || undefined,
      etat: etat.value,
      notes: notes.value.trim() || undefined,
    })
    notifications.success(
      'Retour enregistré',
      `${quantite.value} ${props.ligne.unite} · ${props.ligne.articleNom}`,
    )
    open.value = false
    emit('saved')
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Enregistrement impossible')
        : 'Enregistrement impossible'
    erreur.value = msg
    notifications.danger('Retour impossible', msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppModal v-model:open="open" title="Enregistrer un retour">
    <div v-if="ligne" class="space-y-4">
      <div class="rounded-md bg-paper-2 px-3 py-2.5">
        <p class="text-sm font-medium text-ink">{{ ligne.articleNom }}</p>
        <p class="mt-0.5 text-[12px] text-muted">
          Bon {{ ligne.reference }}
          <span v-if="ligne.chantierNom"> · {{ ligne.chantierNom }}</span>
          <span v-if="ligne.beneficiaireNom"> · retiré par {{ ligne.beneficiaireNom }}</span>
        </p>
        <p class="mt-1 text-[12px] text-ink-3">
          {{ ligne.restant }} {{ ligne.unite }} à rendre sur {{ ligne.quantite }} sorti(s)
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="quantite" label="Quantité rendue" type="number" placeholder="1" />
        <AppInput v-model="dateRetour" label="Date du retour" type="date" />
      </div>

      <AppSelect v-model="etat" label="État du matériel" :options="etatOptions" />

      <div>
        <label class="mb-1.5 block text-[12px] font-medium text-ink-2">Notes (optionnel)</label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Ex : manche fissuré, rendu au magasin par le chef d'équipe…"
          class="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30"
        />
      </div>

      <p v-if="etat === 'endommage'" class="text-[12px] text-muted">
        Le matériel endommagé solde la ligne sans revenir en stock : l'inventaire reste juste et la
        perte est tracée.
      </p>

      <p v-if="erreur" class="rounded-md bg-rust/10 px-3 py-2 text-[12px] text-rust-dark">
        {{ erreur }}
      </p>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="open = false">Annuler</AppButton>
      <AppButton :loading="submitting" :disabled="!quantiteValide" @click="confirmer">
        Enregistrer le retour
      </AppButton>
    </template>
  </AppModal>
</template>
