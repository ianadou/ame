<script setup lang="ts">
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import type { Categorie } from '~/composables/useCategories'

const { categories, loading, fetchCategories, createCategorie, updateCategorie, deleteCategorie } =
  useCategories()
const notifications = useNotifications()

const showCreateModal = ref(false)
const editing = ref<Categorie | null>(null)
const deletingItem = ref<Categorie | null>(null)
const deleteBusy = ref(false)

interface Row {
  cat: Categorie
  isChild: boolean
}

const rows = computed<Row[]>(() => {
  const out: Row[] = []
  for (const root of categories.value) {
    out.push({ cat: root, isChild: false })
    for (const child of root.children ?? []) {
      out.push({ cat: child, isChild: true })
    }
  }
  return out
})

const parentOptions = computed(() => categories.value.map((c) => ({ value: c.id, label: c.nom })))

async function handleCreate(data: Record<string, unknown>) {
  await createCategorie(data)
  showCreateModal.value = false
  notifications.success('Catégorie créée', String(data.nom))
  await fetchCategories()
}

async function handleUpdate(data: Record<string, unknown>) {
  if (!editing.value) return
  await updateCategorie(editing.value.id, data)
  notifications.success('Catégorie modifiée', String(data.nom))
  editing.value = null
  await fetchCategories()
}

async function confirmDelete() {
  if (!deletingItem.value) return
  deleteBusy.value = true
  try {
    const nom = deletingItem.value.nom
    await deleteCategorie(deletingItem.value.id)
    notifications.success('Catégorie supprimée', nom)
    deletingItem.value = null
    await fetchCategories()
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? ((e as { data?: { message?: string } }).data?.message ?? 'Suppression impossible.')
        : 'Suppression impossible.'
    notifications.danger('Suppression impossible', msg)
  } finally {
    deleteBusy.value = false
  }
}

await fetchCategories()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-[13px] text-muted">Organisez vos articles par catégorie et sous-catégorie.</p>
      <AppButton @click="showCreateModal = true">
        <Plus class="h-4 w-4" />
        Ajouter
      </AppButton>
    </div>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th class="w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody v-if="!loading && rows.length > 0">
            <tr v-for="row in rows" :key="row.cat.id" class="row-hover">
              <td class="font-medium" :class="{ 'pl-8 font-normal text-ink-3': row.isChild }">
                <span v-if="row.isChild" class="text-muted">↳ </span>{{ row.cat.nom }}
              </td>
              <td class="text-muted">{{ row.cat.description ?? '—' }}</td>
              <td>
                <div class="flex justify-end gap-1">
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-paper-2 hover:text-ink"
                    title="Modifier"
                    @click="editing = row.cat"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-rust/10 hover:text-rust"
                    title="Supprimer"
                    @click="deletingItem = row.cat"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="3" />

      <AppEmptyState
        v-if="!loading && rows.length === 0"
        title="Aucune catégorie"
        description="Commencez par créer votre première catégorie."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Ajouter une catégorie
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <!-- Create modal -->
    <AppModal v-model:open="showCreateModal" title="Nouvelle catégorie">
      <CategorieForm :parents="parentOptions" @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </CategorieForm>
    </AppModal>

    <!-- Edit modal -->
    <AppModal
      :open="editing !== null"
      title="Modifier la catégorie"
      @update:open="
        (v: boolean) => {
          if (!v) editing = null
        }
      "
    >
      <CategorieForm
        v-if="editing"
        :parents="parentOptions.filter((o) => o.value !== editing!.id)"
        :initial="{
          nom: editing.nom,
          description: editing.description ?? '',
          parentId: editing.parentId ?? '',
        }"
        @submit="handleUpdate"
      >
        <template #actions>
          <AppButton variant="secondary" @click="editing = null">Annuler</AppButton>
          <AppButton type="submit">Enregistrer</AppButton>
        </template>
      </CategorieForm>
    </AppModal>

    <!-- Delete confirm -->
    <AppModal
      :open="deletingItem !== null"
      title="Supprimer la catégorie"
      @update:open="
        (v: boolean) => {
          if (!v) deletingItem = null
        }
      "
    >
      <p class="text-[13.5px] text-ink-3">
        Confirmer la suppression de
        <span class="font-medium text-ink">{{ deletingItem?.nom }}</span> ? Cette action est
        irréversible.
      </p>
      <div class="mt-5 flex justify-end gap-3">
        <AppButton variant="secondary" @click="deletingItem = null">Annuler</AppButton>
        <AppButton variant="danger" :disabled="deleteBusy" @click="confirmDelete">
          Supprimer
        </AppButton>
      </div>
    </AppModal>
  </div>
</template>
