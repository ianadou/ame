<script setup lang="ts">
import { Bell, Check, CheckCheck } from 'lucide-vue-next'
import type { NotifVariant } from '~/composables/useNotifications'

const { pending, pendingCount, markHandled, markAllHandled } = useNotifications()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const dot: Record<NotifVariant, string> = {
  info: 'bg-slate-500',
  success: 'bg-forest',
  warning: 'bg-ochre',
  danger: 'bg-rust',
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

function heure(ts: number) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(ts),
  )
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      class="relative flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white hover:bg-paper-4"
      aria-label="Notifications"
      @click="open = !open"
    >
      <Bell class="h-4 w-4" />
      <span
        v-if="pendingCount > 0"
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 text-[9px] font-semibold text-white"
      >
        {{ pendingCount }}
      </span>
    </button>

    <Transition name="np">
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-line bg-white shadow-soft-md"
      >
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <div class="text-[13px] font-semibold text-ink">
            Notifications
            <span v-if="pendingCount > 0" class="ml-1 text-muted">· {{ pendingCount }}</span>
          </div>
          <button
            v-if="pendingCount > 0"
            class="flex items-center gap-1 text-[11.5px] text-muted hover:text-ink"
            @click="markAllHandled"
          >
            <CheckCheck class="h-3.5 w-3.5" />Tout traiter
          </button>
        </div>

        <div class="max-h-[60vh] overflow-y-auto">
          <div
            v-for="n in pending"
            :key="n.id"
            class="flex items-start gap-3 border-b border-line/60 px-4 py-3 last:border-0 hover:bg-paper-2"
          >
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="dot[n.variant]" />
            <div class="min-w-0 flex-1">
              <div class="text-[12.5px] font-medium leading-snug text-ink">{{ n.title }}</div>
              <div v-if="n.message" class="mt-0.5 text-[11.5px] leading-snug text-muted">
                {{ n.message }}
              </div>
              <div class="mono mt-1 text-[10px] text-muted">{{ heure(n.createdAt) }}</div>
            </div>
            <button
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted hover:bg-paper-4 hover:text-ink"
              title="Marquer comme traité"
              @click="markHandled(n.id)"
            >
              <Check class="h-3.5 w-3.5" />
            </button>
          </div>

          <div v-if="pendingCount === 0" class="px-4 py-10 text-center text-[12.5px] text-muted">
            Aucune notification en attente.
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.np-enter-active,
.np-leave-active {
  transition: all 0.16s ease;
}
.np-enter-from,
.np-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
