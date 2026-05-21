<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

interface MouvementDetail {
  id: string
  type: string
  quantite: number
  signe: number
  bonLivraison: string | null
  motif: string | null
  createdAt: string
  article: { id: string; reference: string; nom: string; unite: string }
  fournisseur: { id: string; nom: string } | null
  sortie: {
    id: string
    reference: string
    clientId: string | null
    clientNom: string | null
  } | null
  stockAvant: number
  stockApres: number
}

const props = defineProps<{ id: string | null }>()
const emit = defineEmits<{ close: [] }>()

const open = computed({
  get: () => props.id !== null,
  set: (v: boolean) => {
    if (!v) emit('close')
  },
})

const detail = ref<MouvementDetail | null>(null)
const loading = ref(false)
const erreur = ref<string | null>(null)

async function charger(id: string) {
  loading.value = true
  erreur.value = null
  detail.value = null
  try {
    detail.value = await $fetch<MouvementDetail>(`/api/mouvements/${id}`)
  } catch (e: unknown) {
    erreur.value =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Chargement impossible')
        : 'Chargement impossible'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.id,
  (id) => {
    if (id) charger(id)
  },
  { immediate: true },
)

function mvtMeta(type: string): { label: string; variant: 'success' | 'neutral' | 'info' } {
  if (type === 'entree') return { label: 'Entrée', variant: 'success' }
  if (type === 'sortie') return { label: 'Sortie', variant: 'neutral' }
  if (type === 'ajustement_positif') return { label: 'Ajustement +', variant: 'info' }
  if (type === 'ajustement_negatif') return { label: 'Ajustement −', variant: 'info' }
  return { label: type, variant: 'neutral' }
}

function formatDateTime(iso: string) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}
</script>

<template>
  <AppModal v-model:open="open" title="Détail de la transaction">
    <div v-if="loading" class="space-y-3 py-4">
      <div class="h-4 w-1/3 animate-pulse rounded bg-paper-2" />
      <div class="h-12 animate-pulse rounded bg-paper-2" />
      <div class="h-20 animate-pulse rounded bg-paper-2" />
    </div>

    <p v-else-if="erreur" class="py-6 text-center text-sm text-rust-dark">{{ erreur }}</p>

    <div v-else-if="detail" class="space-y-5">
      <!-- Type + quantité + horodatage -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <AppBadge :variant="mvtMeta(detail.type).variant" solid>
            {{ mvtMeta(detail.type).label }}
          </AppBadge>
          <p class="mt-2 text-xs text-muted">{{ formatDateTime(detail.createdAt) }}</p>
        </div>
        <div class="mono num text-right text-[28px] font-semibold leading-none text-ink">
          {{ detail.signe > 0 ? '+' : '−' }}{{ detail.quantite }}
          <span class="ml-1 text-[13px] font-normal text-muted">{{ detail.article.unite }}</span>
        </div>
      </div>

      <!-- Article -->
      <div class="rounded-md border border-line bg-paper-2 px-3 py-2.5">
        <p class="text-[11px] uppercase tracking-wider text-muted">Article</p>
        <NuxtLink
          :to="`/stock/${detail.article.id}`"
          class="mt-1 flex items-baseline gap-2 hover:text-forest"
          @click="emit('close')"
        >
          <span class="mono text-[13px] font-medium text-ink-2">{{ detail.article.reference }}</span>
          <span class="text-sm font-medium text-ink">{{ detail.article.nom }}</span>
        </NuxtLink>
      </div>

      <!-- Origine / destination -->
      <div v-if="detail.fournisseur" class="rounded-md border border-line px-3 py-2.5">
        <p class="text-[11px] uppercase tracking-wider text-muted">Fournisseur</p>
        <NuxtLink
          :to="`/fournisseurs/${detail.fournisseur.id}`"
          class="mt-1 inline-block text-sm font-medium text-ink hover:text-forest"
          @click="emit('close')"
        >
          {{ detail.fournisseur.nom }}
        </NuxtLink>
      </div>

      <div v-if="detail.sortie" class="rounded-md border border-line px-3 py-2.5">
        <p class="text-[11px] uppercase tracking-wider text-muted">Bon de sortie</p>
        <NuxtLink
          :to="`/sorties/${detail.sortie.id}`"
          class="mt-1 inline-block text-sm font-medium text-ink hover:text-forest"
          @click="emit('close')"
        >
          {{ detail.sortie.reference }}
        </NuxtLink>
        <span v-if="detail.sortie.clientNom" class="ml-2 text-sm text-muted">
          ·
          <NuxtLink
            v-if="detail.sortie.clientId"
            :to="`/clients/${detail.sortie.clientId}`"
            class="hover:text-ink"
            @click="emit('close')"
          >
            {{ detail.sortie.clientNom }}
          </NuxtLink>
          <template v-else>{{ detail.sortie.clientNom }}</template>
        </span>
      </div>

      <!-- Motif + bon de livraison -->
      <div v-if="detail.motif || detail.bonLivraison" class="space-y-2">
        <div v-if="detail.bonLivraison">
          <p class="text-[11px] uppercase tracking-wider text-muted">Bon de livraison</p>
          <p class="mono text-sm text-ink-2">{{ detail.bonLivraison }}</p>
        </div>
        <div v-if="detail.motif">
          <p class="text-[11px] uppercase tracking-wider text-muted">Motif</p>
          <p class="whitespace-pre-line text-sm text-ink-2">{{ detail.motif }}</p>
        </div>
      </div>

      <!-- Impact stock -->
      <div class="rounded-md border border-line bg-paper-2 px-3 py-2.5">
        <p class="text-[11px] uppercase tracking-wider text-muted">Impact sur le stock</p>
        <div class="mt-1 flex items-center gap-3">
          <div class="text-center">
            <p class="text-[11px] text-muted">Avant</p>
            <p class="mono num text-lg font-semibold text-ink-2">{{ detail.stockAvant }}</p>
          </div>
          <ArrowRight class="h-4 w-4 text-ink-4" />
          <div class="text-center">
            <p class="text-[11px] text-muted">Après</p>
            <p class="mono num text-lg font-semibold text-ink">{{ detail.stockApres }}</p>
          </div>
          <span class="ml-auto text-[12px] text-muted">{{ detail.article.unite }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="open = false">Fermer</AppButton>
    </template>
  </AppModal>
</template>
