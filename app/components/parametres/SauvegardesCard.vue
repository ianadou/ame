<script setup lang="ts">
import { DatabaseBackup, FolderOpen, RotateCcw } from 'lucide-vue-next'
import type { MotifSauvegarde, Sauvegarde } from '~/composables/useSauvegardes'

const { etat, loading, charger, sauvegarder, restaurer, ouvrirDossier } = useSauvegardes()
const notifications = useNotifications()

const MOTIFS: Record<MotifSauvegarde, string> = {
  quotidienne: 'Quotidienne',
  manuelle: 'Manuelle',
  'avant-mise-a-jour': 'Avant mise à jour',
  'avant-effacement': 'Avant effacement',
  'avant-restauration': 'Avant restauration',
}

function taille(octets: number): string {
  if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

function messageErreur(e: unknown, defaut: string): string {
  return e && typeof e === 'object' && 'data' in e
    ? ((e as { data?: { message?: string } }).data?.message ?? defaut)
    : defaut
}

const sauvegardeEnCours = ref(false)
const aRestaurer = ref<Sauvegarde | null>(null)
const restaurationEnCours = ref(false)

// Jusqu'à dix copies par motif : la liste complète noierait la page, les plus
// récentes suffisent presque toujours.
const APERCU = 5
const toutAfficher = ref(false)
const visibles = computed(() =>
  toutAfficher.value ? etat.value.sauvegardes : etat.value.sauvegardes.slice(0, APERCU),
)

async function sauvegarderMaintenant() {
  sauvegardeEnCours.value = true
  try {
    const sauvegarde = await sauvegarder()
    notifications.success('Sauvegarde créée', formatDateTime(sauvegarde.creeLe))
    await charger()
  } catch (e) {
    notifications.danger('Sauvegarde impossible', messageErreur(e, 'Sauvegarde impossible'))
  } finally {
    sauvegardeEnCours.value = false
  }
}

async function ouvrir() {
  try {
    await ouvrirDossier()
  } catch (e) {
    notifications.danger(
      'Ouverture impossible',
      messageErreur(e, "Le dossier n'a pas pu être ouvert"),
    )
  }
}

async function confirmerRestauration() {
  if (!aRestaurer.value) return
  restaurationEnCours.value = true
  try {
    await restaurer(aRestaurer.value.nom)
    notifications.success('Sauvegarde restaurée', 'Rechargement de l’application')
    // Toutes les pages ont en mémoire des données qui viennent d'être remplacées.
    window.location.reload()
  } catch (e) {
    notifications.danger('Restauration impossible', messageErreur(e, 'Restauration impossible'))
    restaurationEnCours.value = false
  }
}

onMounted(charger)
</script>

<template>
  <AppCard>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="max-w-md">
        <h3 class="text-sm font-semibold text-ink">Sauvegardes</h3>
        <p class="mt-1 text-sm text-muted">
          Une copie de la base est faite chaque jour, avant une mise à jour et avant « Tout effacer
          ». Pour résister à une panne de l'ordinateur, copiez régulièrement ce dossier sur une clé
          USB ou un Drive.
        </p>
      </div>
      <div v-if="etat.disponible" class="flex flex-wrap gap-2">
        <AppButton variant="secondary" size="sm" @click="ouvrir">
          <FolderOpen class="h-4 w-4" />
          Ouvrir le dossier
        </AppButton>
        <AppButton size="sm" :loading="sauvegardeEnCours" @click="sauvegarderMaintenant">
          <DatabaseBackup class="h-4 w-4" />
          Sauvegarder maintenant
        </AppButton>
      </div>
    </div>

    <p v-if="!etat.disponible" class="mt-4 text-sm text-muted">
      La base n'est pas stockée sur cet ordinateur : les sauvegardes locales ne s'appliquent pas.
    </p>

    <template v-else>
      <p v-if="etat.dossier" class="mono mt-3 break-all text-[11.5px] text-muted">
        {{ etat.dossier }}
      </p>

      <div class="mt-4 overflow-hidden rounded-md border border-line">
        <table v-if="etat.sauvegardes.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th class="text-right">Taille</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="sauvegarde in visibles" :key="sauvegarde.nom" class="row-hover">
              <td class="mono text-[12.5px] text-ink-2">
                {{ formatDateTime(sauvegarde.creeLe) }}
              </td>
              <td class="text-ink-2">{{ MOTIFS[sauvegarde.motif] ?? sauvegarde.motif }}</td>
              <td class="mono num text-right text-muted">{{ taille(sauvegarde.taille) }}</td>
              <td class="text-right">
                <AppButton variant="ghost" size="sm" @click="aRestaurer = sauvegarde">
                  <RotateCcw class="h-3.5 w-3.5" />
                  Restaurer
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>

        <AppEmptyState
          v-else-if="!loading"
          :icon="DatabaseBackup"
          title="Aucune sauvegarde pour l'instant"
          description="La première copie sera faite au prochain démarrage, ou tout de suite avec « Sauvegarder maintenant »."
        />
      </div>

      <button
        v-if="etat.sauvegardes.length > APERCU"
        type="button"
        class="mt-3 text-[12.5px] font-medium text-ink-3 hover:text-ink"
        @click="toutAfficher = !toutAfficher"
      >
        {{
          toutAfficher ? 'Réduire la liste' : `Afficher les ${etat.sauvegardes.length} sauvegardes`
        }}
      </button>
    </template>

    <ConfirmDialog
      :open="aRestaurer !== null"
      title="Restaurer cette sauvegarde"
      :cible="
        aRestaurer
          ? `${MOTIFS[aRestaurer.motif] ?? aRestaurer.motif} du ${formatDateTime(aRestaurer.creeLe)}`
          : ''
      "
      message="Toutes les données actuelles seront remplacées par celles de cette sauvegarde. Une copie de l'état actuel est faite juste avant : vous pourrez revenir en arrière."
      confirm-label="Restaurer"
      :loading="restaurationEnCours"
      @update:open="(v) => !v && (aRestaurer = null)"
      @confirm="confirmerRestauration"
    />
  </AppCard>
</template>
