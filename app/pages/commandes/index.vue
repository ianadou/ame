<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

const { commandes, loading, fetchCommandes, createCommande } = useCommandes()

const statutFilter = ref('')
const fournisseurFilter = ref('')
const showCreateModal = ref(false)

const statutOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoyee', label: 'Envoyée' },
  { value: 'partielle', label: 'Reçue partiellement' },
  { value: 'recue', label: 'Reçue' },
  { value: 'annulee', label: 'Annulée' },
]

const { data: fournisseurs } = await useFetch<{ id: string; nom: string }[]>('/api/fournisseurs')

const fournisseurOptions = computed(() =>
  (fournisseurs.value ?? []).map((f) => ({ value: f.id, label: f.nom })),
)

async function loadCommandes() {
  await fetchCommandes({
    statut: statutFilter.value || undefined,
    fournisseur: fournisseurFilter.value || undefined,
  })
}

watch([statutFilter, fournisseurFilter], loadCommandes)

async function handleCreate(data: Record<string, unknown>) {
  await createCommande(data)
  showCreateModal.value = false
  await loadCommandes()
}

function formatMontant(montant: number) {
  return `${montant.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
}

await loadCommandes()
</script>

<template>
  <div class="space-y-4">
    <!-- Filters bar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row">
        <AppSelect v-model="statutFilter" :options="statutOptions" placeholder="Tous les statuts" />
        <AppSelect
          v-model="fournisseurFilter"
          :options="fournisseurOptions"
          placeholder="Tous les fournisseurs"
        />
      </div>
      <AppButton @click="showCreateModal = true">
        <Plus class="h-4 w-4" />
        Nouvelle commande
      </AppButton>
    </div>

    <!-- Table -->
    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th class="w-[200px]">Référence</th>
              <th>Fournisseur</th>
              <th>Statut</th>
              <th class="text-center">Total estimé</th>
              <th>Livraison prévue</th>
            </tr>
          </thead>
          <tbody v-if="!loading && commandes.length > 0">
            <tr
              v-for="commande in commandes"
              :key="commande.id"
              class="row-hover cursor-pointer"
              @click="navigateTo(`/commandes/${commande.id}`)"
            >
              <td class="mono font-medium text-ink-2">{{ commande.reference }}</td>
              <td>{{ commande.fournisseurNom ?? '' }}</td>
              <td>
                <AppBadge :variant="metaCommande(commande.statut).variant" solid>
                  {{ metaCommande(commande.statut).label }}
                </AppBadge>
              </td>
              <td class="mono num text-center font-semibold">
                {{ formatMontant(commande.total) }}
              </td>
              <td class="mono text-[12.5px] text-muted">
                {{ formatDate(commande.dateLivraisonPrevue) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TableSkeleton v-if="loading" :cols="5" />

      <AppEmptyState
        v-if="!loading && commandes.length === 0"
        title="Aucune commande"
        description="Créez votre première commande fournisseur."
      >
        <template #action>
          <AppButton @click="showCreateModal = true">
            <Plus class="h-4 w-4" />
            Nouvelle commande
          </AppButton>
        </template>
      </AppEmptyState>
    </AppCard>

    <!-- Create modal -->
    <AppModal v-model:open="showCreateModal" title="Nouvelle commande">
      <CommandeForm @submit="handleCreate">
        <template #actions>
          <AppButton variant="secondary" @click="showCreateModal = false">Annuler</AppButton>
          <AppButton type="submit">Créer</AppButton>
        </template>
      </CommandeForm>
    </AppModal>
  </div>
</template>
