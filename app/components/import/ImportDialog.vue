<script setup lang="ts">
import { UploadCloud, FileDown, AlertTriangle } from 'lucide-vue-next'
import type { RapportImport } from '~/composables/useImport'

const props = defineProps<{
  entites: { value: string; label: string }[]
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ done: [] }>()

const { urlModele, previsualiser, appliquer } = useImport()
const notifications = useNotifications()

const entite = ref(props.entites[0]?.value ?? '')
const etape = ref<'select' | 'preview' | 'result'>('select')
const fichier = ref<File | null>(null)
const rapport = ref<RapportImport | null>(null)
const chargement = ref(false)
const erreurGlobale = ref<string | null>(null)

watch(open, (v) => {
  if (v) reset()
})

function reset() {
  entite.value = props.entites[0]?.value ?? ''
  etape.value = 'select'
  fichier.value = null
  rapport.value = null
  chargement.value = false
  erreurGlobale.value = null
}

function messageErreur(e: unknown): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const d = (e as { data?: { message?: string } }).data
    if (d?.message) return d.message
  }
  return e instanceof Error ? e.message : 'Erreur lors de l’import'
}

async function onFichier(event: Event) {
  const f = (event.target as HTMLInputElement).files?.[0]
  if (!f) return
  fichier.value = f
  erreurGlobale.value = null
  chargement.value = true
  try {
    rapport.value = await previsualiser(entite.value, f)
    etape.value = 'preview'
  } catch (e: unknown) {
    erreurGlobale.value = messageErreur(e)
  } finally {
    chargement.value = false
  }
}

async function confirmer() {
  if (!fichier.value) return
  chargement.value = true
  erreurGlobale.value = null
  try {
    const r = await appliquer(entite.value, fichier.value)
    rapport.value = r
    etape.value = 'result'
    const titre = `Import ${entite.value} terminé`
    const detail = `${r.crees ?? 0} créé(s), ${r.maj ?? 0} mis à jour`
    if (r.erreurs.length > 0) {
      notifications.warning(titre, `${detail}, ${r.erreurs.length} ligne(s) en erreur`)
    } else {
      notifications.success(titre, detail)
    }
    emit('done')
  } catch (e: unknown) {
    erreurGlobale.value = messageErreur(e)
    notifications.danger("Échec de l'import", messageErreur(e))
  } finally {
    chargement.value = false
  }
}

function telechargerErreurs() {
  if (!rapport.value) return
  const lignes = [
    'ligne;champ;message',
    ...rapport.value.erreurs.map(
      (e) => `${e.ligne};${e.champ ?? ''};"${e.message.replace(/"/g, '""')}"`,
    ),
  ]
  const blob = new Blob(['﻿' + lignes.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `erreurs-import-${rapport.value.entite}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const titreEntite = computed(() => props.entites.find((e) => e.value === entite.value)?.label ?? '')
</script>

<template>
  <AppModal v-model:open="open" title="Importer des données">
    <div class="space-y-4">
      <!-- Étape sélection -->
      <template v-if="etape === 'select'">
        <AppSelect
          v-if="entites.length > 1"
          v-model="entite"
          label="Type de données"
          :options="entites"
        />

        <a
          :href="urlModele(entite)"
          class="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          <FileDown class="h-4 w-4" />
          Télécharger le modèle {{ titreEntite }} ({{ entite === 'tous' ? 'xlsx' : 'CSV' }})
        </a>

        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-10 text-center transition-colors hover:border-primary-400 hover:bg-slate-50"
        >
          <UploadCloud class="h-8 w-8 text-slate-400" />
          <span class="text-sm font-medium text-slate-700">
            {{
              entite === 'tous'
                ? 'Choisir un fichier Excel (.xlsx) multi-feuilles'
                : 'Choisir un fichier CSV ou Excel (.xlsx)'
            }}
          </span>
          <span class="text-xs text-slate-500">
            {{
              entite === 'tous'
                ? 'Feuilles nommées : articles, categories, fournisseurs, clients'
                : 'Max 5 Mo, 5000 lignes'
            }}
          </span>
          <input
            type="file"
            :accept="entite === 'tous' ? '.xlsx' : '.csv,.xlsx'"
            class="hidden"
            @change="onFichier"
          />
        </label>
      </template>

      <!-- Étape aperçu / résultat -->
      <template v-else>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="rounded-md bg-slate-50 px-3 py-2">
            <p class="text-xs text-slate-500">Lignes</p>
            <p class="text-lg font-semibold text-slate-900">{{ rapport?.total }}</p>
          </div>
          <div class="rounded-md bg-green-50 px-3 py-2">
            <p class="text-xs text-slate-500">À créer / créés</p>
            <p class="text-lg font-semibold text-green-700">{{ rapport?.crees ?? 0 }}</p>
          </div>
          <div class="rounded-md bg-sky-50 px-3 py-2">
            <p class="text-xs text-slate-500">À MAJ / mis à jour</p>
            <p class="text-lg font-semibold text-sky-700">{{ rapport?.maj ?? 0 }}</p>
          </div>
        </div>

        <div
          v-if="rapport && rapport.avertissements.length > 0"
          class="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          <p v-for="(a, i) in rapport.avertissements" :key="i">{{ a }}</p>
        </div>

        <div v-if="rapport && rapport.erreurs.length > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertTriangle class="h-4 w-4" />
              {{ rapport.erreurs.length }} ligne(s) en erreur
            </p>
            <button
              class="text-xs font-medium text-primary-700 hover:text-primary-800"
              @click="telechargerErreurs"
            >
              Télécharger les erreurs (CSV)
            </button>
          </div>
          <div class="max-h-40 overflow-y-auto rounded-md border border-slate-200">
            <table class="w-full text-xs">
              <tbody>
                <tr
                  v-for="(e, i) in rapport.erreurs.slice(0, 50)"
                  :key="i"
                  class="border-b border-slate-100 last:border-0"
                >
                  <td class="px-3 py-1.5 text-slate-500">L{{ e.ligne }}</td>
                  <td class="px-3 py-1.5 font-medium text-slate-700">{{ e.champ }}</td>
                  <td class="px-3 py-1.5 text-slate-600">{{ e.message }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p
          v-if="etape === 'result'"
          class="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          Import terminé : {{ rapport?.crees ?? 0 }} créé(s), {{ rapport?.maj ?? 0 }} mis à jour.
        </p>
      </template>

      <p v-if="erreurGlobale" class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ erreurGlobale }}
      </p>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="open = false">
        {{ etape === 'result' ? 'Fermer' : 'Annuler' }}
      </AppButton>
      <AppButton
        v-if="etape === 'preview'"
        :loading="chargement"
        :disabled="!rapport || rapport.valides === 0"
        @click="confirmer"
      >
        Appliquer l’import
      </AppButton>
    </template>
  </AppModal>
</template>
