<script setup lang="ts">
const { user, editing, configured, save } = useSessionUser()

const nom = ref('')
const saving = ref(false)
const erreur = ref<string | null>(null)

// Visible si non configuré (1er lancement, bloquant) ou en mode édition.
const visible = computed(() => !configured.value || editing.value)
// Fermable uniquement si une identité existe déjà (édition volontaire).
const dismissible = computed(() => configured.value)

watch(
  visible,
  (v) => {
    if (v) {
      nom.value = user.value.nomEntreprise ?? ''
      erreur.value = null
    }
  },
  { immediate: true },
)

const peutValider = computed(() => nom.value.trim() !== '')

async function valider() {
  if (!peutValider.value || saving.value) return
  saving.value = true
  erreur.value = null
  try {
    await save(nom.value.trim())
  } catch (e: unknown) {
    erreur.value = e instanceof Error ? e.message : 'Enregistrement impossible'
  } finally {
    saving.value = false
  }
}

function fermer() {
  if (dismissible.value) editing.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="fermer" />

        <div
          class="relative w-full max-w-[440px] overflow-hidden rounded-xl bg-white shadow-soft-md"
        >
          <div class="border-b border-line px-6 py-4">
            <h2 class="text-[18px] font-semibold leading-none text-ink">
              {{ configured ? 'Modifier mon entreprise' : 'Bienvenue sur AME' }}
            </h2>
            <p class="mt-1.5 text-[12.5px] text-muted">
              {{
                configured
                  ? 'Mettez à jour le nom de votre entreprise.'
                  : 'Renseignez le nom de votre entreprise pour commencer.'
              }}
            </p>
          </div>

          <div class="space-y-4 p-6">
            <AppInput
              v-model="nom"
              label="Nom de votre entreprise"
              placeholder="Quincaillerie du Plateau"
            />
            <p v-if="erreur" class="text-[12px] text-rust-dark">{{ erreur }}</p>
          </div>

          <div class="flex justify-end gap-3 border-t border-line bg-paper-2 px-6 py-4">
            <AppButton v-if="dismissible" variant="secondary" @click="fermer"> Annuler </AppButton>
            <AppButton
              variant="primary"
              :loading="saving"
              :disabled="!peutValider"
              @click="valider"
            >
              {{ configured ? 'Enregistrer' : 'Commencer' }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
