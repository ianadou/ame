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
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="open = false" />

        <div class="relative w-full max-w-lg rounded-lg bg-white shadow-md">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
            <button
              class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              @click="open = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="px-5 py-4">
            <slot />
          </div>

          <div v-if="$slots.footer" class="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
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
