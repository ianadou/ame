<script setup lang="ts">
import { Info, CircleCheck, TriangleAlert, OctagonAlert, X } from 'lucide-vue-next'
import type { NotifVariant } from '~/composables/useNotifications'

const { toasts, hideToast } = useNotifications()

const meta: Record<NotifVariant, { icon: typeof Info; bg: string }> = {
  info: { icon: Info, bg: 'bg-slate-700' },
  success: { icon: CircleCheck, bg: 'bg-forest' },
  warning: { icon: TriangleAlert, bg: 'bg-ochre-dark' },
  danger: { icon: OctagonAlert, bg: 'bg-rust' },
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2.5"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 rounded-lg py-3 pl-4 pr-3 text-white shadow-soft-md"
          :class="meta[t.variant].bg"
        >
          <component :is="meta[t.variant].icon" class="mt-0.5 h-[18px] w-[18px] shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-semibold leading-snug">{{ t.title }}</div>
            <div v-if="t.message" class="mt-0.5 text-[12px] leading-snug text-white/80">
              {{ t.message }}
            </div>
          </div>
          <button
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/70 hover:bg-white/15 hover:text-white"
            aria-label="Fermer"
            @click="hideToast(t.id)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.22s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
.toast-move {
  transition: transform 0.22s ease;
}
</style>
