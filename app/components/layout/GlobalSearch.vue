<script setup lang="ts">
import { Search, Package, Truck, Users, CornerDownLeft } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'

const { open, closeSearch } = useGlobalSearch()

interface Result {
  type: 'article' | 'fournisseur' | 'client'
  id: string
  titre: string
  sous: string
  to: string
}

const query = ref('')
const loading = ref(false)
const results = ref<Result[]>([])
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

const groupes = computed(() => {
  const g: Record<string, Result[]> = {}
  for (const r of results.value) (g[r.type] ??= []).push(r)
  return g
})
const labelGroupe: Record<string, string> = {
  article: 'Articles',
  fournisseur: 'Fournisseurs',
  client: 'Clients',
}
const iconGroupe = { article: Package, fournisseur: Truck, client: Users }

const run = useDebounceFn(async () => {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const [arts, fours, clis] = await Promise.all([
      $fetch<{
        data: { id: string; reference: string; nom: string; categorieNom: string | null }[]
      }>(`/api/articles?search=${encodeURIComponent(q)}&limit=6`),
      $fetch<{ id: string; nom: string; contact: string | null }[]>(
        `/api/fournisseurs?search=${encodeURIComponent(q)}`,
      ),
      $fetch<{ id: string; nom: string; ville: string | null; contact: string | null }[]>(
        `/api/clients?search=${encodeURIComponent(q)}`,
      ),
    ])
    const out: Result[] = []
    for (const a of arts.data ?? [])
      out.push({
        type: 'article',
        id: a.id,
        titre: `${a.reference} — ${a.nom}`,
        sous: a.categorieNom ?? 'Sans catégorie',
        to: `/stock/${a.id}`,
      })
    for (const f of (fours ?? []).slice(0, 5))
      out.push({
        type: 'fournisseur',
        id: f.id,
        titre: f.nom,
        sous: f.contact ?? '—',
        to: `/fournisseurs/${f.id}`,
      })
    for (const c of (clis ?? []).slice(0, 5))
      out.push({
        type: 'client',
        id: c.id,
        titre: c.nom,
        sous: c.ville ?? c.contact ?? '—',
        to: `/clients/${c.id}`,
      })
    results.value = out
    activeIndex.value = 0
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}, 220)

watch(query, run)

watch(open, async (v) => {
  if (v) {
    query.value = ''
    results.value = []
    activeIndex.value = 0
    await nextTick()
    inputEl.value?.focus()
  }
})

function go(r: Result) {
  closeSearch()
  navigateTo(r.to)
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') closeSearch()
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter' && results.value[activeIndex.value]) {
    go(results.value[activeIndex.value])
  }
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKey)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKey)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="gs">
      <div v-if="open" class="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
        <div class="fixed inset-0 bg-ink/40 backdrop-blur-sm" @click="closeSearch" />
        <div
          class="relative w-full max-w-[600px] overflow-hidden rounded-xl border border-line bg-white shadow-soft-md"
        >
          <div class="flex items-center gap-3 border-b border-line px-4">
            <Search class="h-[18px] w-[18px] shrink-0 text-muted" />
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              placeholder="Rechercher un article, fournisseur, client…"
              class="h-12 w-full bg-transparent text-[14px] text-ink placeholder:text-muted/80 focus:outline-none"
            />
            <span class="mono rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
              ESC
            </span>
          </div>

          <div class="max-h-[52vh] overflow-y-auto">
            <div v-if="loading" class="px-4 py-8 text-center text-[12.5px] text-muted">
              Recherche…
            </div>
            <div
              v-else-if="query && results.length === 0"
              class="px-4 py-10 text-center text-[12.5px] text-muted"
            >
              Aucun résultat pour « {{ query }} »
            </div>
            <div v-else-if="!query" class="px-4 py-10 text-center text-[12.5px] text-muted">
              Tapez pour rechercher dans le stock, les fournisseurs et les clients.
            </div>

            <template v-for="(grp, key) in groupes" v-else :key="key">
              <div
                class="mono bg-paper-2 px-4 py-1.5 text-[10px] uppercase tracking-wider2 text-muted"
              >
                {{ labelGroupe[key] }}
              </div>
              <button
                v-for="r in grp"
                :key="r.id"
                class="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                :class="results.indexOf(r) === activeIndex ? 'bg-paper-2' : 'hover:bg-paper-2/60'"
                @mouseenter="activeIndex = results.indexOf(r)"
                @click="go(r)"
              >
                <component :is="iconGroupe[r.type]" class="h-4 w-4 shrink-0 text-ink-3" />
                <div class="min-w-0 flex-1">
                  <div class="truncate text-[13px] font-medium text-ink">{{ r.titre }}</div>
                  <div class="truncate text-[11.5px] text-muted">{{ r.sous }}</div>
                </div>
                <CornerDownLeft
                  v-if="results.indexOf(r) === activeIndex"
                  class="h-3.5 w-3.5 shrink-0 text-muted"
                />
              </button>
            </template>
          </div>

          <div
            class="flex items-center gap-4 border-t border-line bg-paper-2 px-4 py-2 text-[10.5px] text-muted"
          >
            <span><span class="mono">↑↓</span> naviguer</span>
            <span><span class="mono">↵</span> ouvrir</span>
            <span><span class="mono">esc</span> fermer</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.gs-enter-active,
.gs-leave-active {
  transition: opacity 0.16s ease;
}
.gs-enter-from,
.gs-leave-to {
  opacity: 0;
}
</style>
