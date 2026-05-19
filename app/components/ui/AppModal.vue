<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  title: string
}

defineProps<Props>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="open = false" />

        <div
          class="relative w-full max-w-[640px] overflow-hidden rounded-xl bg-white shadow-soft-md"
        >
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 class="text-[18px] font-semibold leading-none text-ink">{{ title }}</h2>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-paper-2 hover:text-ink"
              @click="open = false"
            >
              <X class="h-[18px] w-[18px]" />
            </button>
          </div>

          <div class="p-6">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="flex justify-end gap-3 border-t border-line bg-paper-2 px-6 py-4"
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
