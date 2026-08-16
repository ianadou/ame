<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  title: string
}

defineProps<Props>()

const open = defineModel<boolean>('open', { default: false })

// Identifiant unique par instance : plusieurs modales coexistent dans le DOM,
// un id partagé ferait pointer tous les aria-labelledby vers le même titre.
const titreId = nextId('modal-titre')

const panneau = ref<HTMLElement | null>(null)
let focusPrecedent: HTMLElement | null = null

const SELECTEUR_FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  if (!panneau.value) return []
  return [...panneau.value.querySelectorAll<HTMLElement>(SELECTEUR_FOCUSABLE)]
}

// Échap ferme, Tab boucle à l'intérieur. Sans ce piège, la tabulation passe
// derrière le voile : l'utilisateur au clavier continue de parcourir la page
// qu'il croyait avoir mise en pause, sans savoir où il est.
function onKeydown(e: KeyboardEvent) {
  if (!open.value) return

  if (e.key === 'Escape') {
    open.value = false
    return
  }
  if (e.key !== 'Tab') return

  const cibles = focusables()
  if (cibles.length === 0) return

  const premier = cibles[0]!
  const dernier = cibles[cibles.length - 1]!
  const actif = document.activeElement

  if (e.shiftKey && (actif === premier || !panneau.value?.contains(actif))) {
    e.preventDefault()
    dernier.focus()
  } else if (!e.shiftKey && actif === dernier) {
    e.preventDefault()
    premier.focus()
  }
}

watch(open, async (ouvert) => {
  if (ouvert) {
    focusPrecedent = document.activeElement as HTMLElement | null
    await nextTick()
    focusables()[0]?.focus()
  } else {
    // Rend le focus au déclencheur, sinon il retombe sur <body> et la
    // navigation clavier repart du haut de la page.
    focusPrecedent?.focus()
    focusPrecedent = null
  }
})

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="open = false" />

        <div
          ref="panneau"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titreId"
          class="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-white shadow-soft-md"
        >
          <div class="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
            <h2 :id="titreId" class="text-[18px] font-semibold leading-none text-ink">
              {{ title }}
            </h2>
            <button
              type="button"
              aria-label="Fermer"
              class="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-paper-2 hover:text-ink"
              @click="open = false"
            >
              <X class="h-[18px] w-[18px]" />
            </button>
          </div>

          <!-- Le corps scrolle seul : un formulaire long garde ses actions
               visibles sur un portable 768px au lieu de les pousser hors écran. -->
          <div class="overflow-y-auto p-6">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="flex shrink-0 justify-end gap-3 border-t border-line bg-paper-2 px-6 py-4"
          >
            <slot name="footer" />
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
