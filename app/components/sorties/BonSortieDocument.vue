<script setup lang="ts">
import type { SessionUser } from '~/composables/useSessionUser'
import type { SortieDetail } from '~/composables/useSorties'

const props = defineProps<{
  sortie: SortieDetail
  entreprise: SessionUser
  afficherPrix: boolean
}>()

const nomEntreprise = computed(() => props.entreprise.nomEntreprise?.trim() || 'AME')

// Une ligne d'en-tête vide laisserait un trou dans le bloc : seules les
// coordonnées renseignées dans Réglages sont imprimées.
const coordonnees = computed(() => {
  const e = props.entreprise
  return [
    [e.adresse, e.ville].filter(Boolean).join(', '),
    e.boitePostale,
    e.telephone && `Tél. ${e.telephone}`,
    [e.ncc && `NCC ${e.ncc}`, e.rccm && `RCCM ${e.rccm}`].filter(Boolean).join(' · '),
  ].filter(Boolean)
})

const contactClient = computed(() =>
  [props.sortie.clientTelephone, props.sortie.clientVille].filter(Boolean).join(' · '),
)

const annule = computed(() => props.sortie.statut === 'annule')
const aRetournables = computed(() => props.sortie.lignes.some((l) => l.retournable))
const tva = computed(() => detailTva(props.sortie.montantTotal, props.sortie.tauxTvaApplique))

const reglement = computed(() => {
  const conditions = libelleConditions(props.sortie.conditionsReglement)
  return props.sortie.dateEcheance
    ? `${conditions}, échéance le ${formatDate(props.sortie.dateEcheance)}`
    : conditions
})

const signatures = computed(() => [
  { titre: 'Remis par', nom: '' },
  { titre: 'Reçu par', nom: props.sortie.beneficiaireNom ?? '' },
])

const editeLe = formatDateTime(new Date().toISOString())
</script>

<template>
  <article
    class="w-[210mm] min-h-[297mm] bg-white p-[14mm] text-ink shadow-soft-md print:min-h-0 print:w-auto print:p-0 print:shadow-none"
  >
    <header class="flex items-start justify-between gap-8 border-b-2 border-ink pb-5">
      <div>
        <p class="text-[20px] font-bold leading-tight">{{ nomEntreprise }}</p>
        <div class="mt-2 space-y-0.5 text-[11px] leading-snug text-ink-3">
          <p v-for="ligne in coordonnees" :key="ligne">{{ ligne }}</p>
        </div>
      </div>
      <div class="shrink-0 text-right">
        <h1 class="display text-[30px] font-bold uppercase leading-none">Bon de sortie</h1>
        <p class="mono mt-2 text-[13px] font-medium">{{ sortie.reference }}</p>
        <p class="mt-0.5 text-[11px] text-ink-3">
          du {{ formatDate(sortie.dateSortie ?? sortie.createdAt) }}
        </p>
      </div>
    </header>

    <div v-if="annule" class="mt-5 rounded-sm border-2 border-rust-dark px-4 py-2.5">
      <p class="text-[12px] font-bold uppercase tracking-wider2 text-rust-dark">
        Bon annulé le {{ formatDateTime(sortie.annuleLe) }}
      </p>
      <p class="mt-0.5 text-[11.5px] text-ink-2">Motif : {{ sortie.motifAnnulation }}</p>
    </div>

    <section class="mt-6 grid grid-cols-3 gap-6">
      <div>
        <h2 class="text-[10px] font-medium uppercase tracking-wider2 text-ink-4">Client</h2>
        <p class="mt-1 text-[13px] font-semibold">{{ sortie.clientNom }}</p>
        <p v-if="contactClient" class="mt-0.5 text-[11px] text-ink-3">{{ contactClient }}</p>
      </div>
      <div v-if="sortie.chantierNom">
        <h2 class="text-[10px] font-medium uppercase tracking-wider2 text-ink-4">Chantier</h2>
        <p class="mt-1 text-[13px] font-semibold">{{ sortie.chantierNom }}</p>
      </div>
      <div v-if="sortie.beneficiaireNom">
        <h2 class="text-[10px] font-medium uppercase tracking-wider2 text-ink-4">Retiré par</h2>
        <p class="mt-1 text-[13px] font-semibold">{{ sortie.beneficiaireNom }}</p>
        <p v-if="sortie.beneficiaireFonction" class="mt-0.5 text-[11px] text-ink-3">
          {{ sortie.beneficiaireFonction }}
        </p>
      </div>
    </section>

    <p v-if="sortie.objet" class="mt-4 text-[12px] text-ink-2">
      <span class="font-medium text-ink">Objet :</span> {{ sortie.objet }}
    </p>

    <table class="mt-6 w-full border-collapse text-[12px]">
      <thead>
        <tr class="border-b border-ink text-left text-[10px] uppercase tracking-wider2 text-ink-3">
          <th class="w-8 py-2 pr-2 font-medium">N°</th>
          <th class="py-2 pr-3 font-medium">Référence</th>
          <th class="py-2 pr-3 font-medium">Désignation</th>
          <th class="py-2 pr-3 text-right font-medium">Quantité</th>
          <th v-if="aRetournables" class="py-2 pr-3 text-center font-medium">À rendre</th>
          <template v-if="afficherPrix">
            <th class="py-2 pr-3 text-right font-medium">Prix unitaire</th>
            <th class="py-2 text-right font-medium">Montant</th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(ligne, index) in sortie.lignes"
          :key="ligne.id"
          class="break-inside-avoid border-b border-line-2"
        >
          <td class="mono num py-2 pr-2 text-ink-3">{{ index + 1 }}</td>
          <td class="mono py-2 pr-3 text-ink-2">{{ ligne.articleReference }}</td>
          <td class="py-2 pr-3">{{ ligne.articleNom }}</td>
          <td class="mono num whitespace-nowrap py-2 pr-3 text-right">
            {{ ligne.quantite }} {{ ligne.unite }}
          </td>
          <td v-if="aRetournables" class="py-2 pr-3 text-center font-semibold">
            {{ ligne.retournable ? 'Oui' : '' }}
          </td>
          <template v-if="afficherPrix">
            <td class="mono num whitespace-nowrap py-2 pr-3 text-right text-ink-2">
              {{ fcfa(ligne.prixUnitaire) }}
            </td>
            <td class="mono num whitespace-nowrap py-2 text-right">
              {{ fcfa(ligne.prixUnitaire * ligne.quantite) }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <div v-if="afficherPrix" class="mt-4 flex justify-end break-inside-avoid">
      <dl class="w-72 text-[12px]">
        <template v-if="tva">
          <div class="flex justify-between py-1">
            <dt class="text-ink-3">Total HT</dt>
            <dd class="mono num">{{ fcfa(tva.ht) }}</dd>
          </div>
          <div class="flex justify-between py-1">
            <dt class="text-ink-3">TVA ({{ tva.taux }} %)</dt>
            <dd class="mono num">{{ fcfa(tva.montantTva) }}</dd>
          </div>
        </template>
        <div class="mt-1 flex justify-between border-t border-ink pt-2 text-[13px] font-semibold">
          <dt>{{ tva ? 'Total TTC' : 'Total' }}</dt>
          <dd class="mono num">{{ fcfa(tva ? tva.ttc : sortie.montantTotal) }}</dd>
        </div>
        <div class="flex justify-between py-1 text-[11px] text-ink-3">
          <dt>Règlement</dt>
          <dd>{{ reglement }}</dd>
        </div>
      </dl>
    </div>

    <section
      v-if="aRetournables || sortie.notes"
      class="mt-6 space-y-2 text-[11.5px] leading-relaxed text-ink-2"
    >
      <p v-if="aRetournables">
        Le matériel marqué « Oui » dans la colonne À rendre reste la propriété de
        {{ nomEntreprise }}. Il doit revenir au magasin, en bon état, à la fin de son utilisation
        sur le chantier.
      </p>
      <p v-if="sortie.notes">
        <span class="font-medium text-ink">Notes :</span> {{ sortie.notes }}
      </p>
    </section>

    <section class="mt-10 grid grid-cols-2 gap-10 break-inside-avoid">
      <div v-for="signature in signatures" :key="signature.titre">
        <h2 class="text-[10px] font-medium uppercase tracking-wider2 text-ink-4">
          {{ signature.titre }}
        </h2>
        <div class="mt-3 flex items-end gap-2 text-[11px]">
          <span class="text-ink-3">Nom</span>
          <span class="h-5 flex-1 border-b border-dotted border-ink-4 text-[12px] leading-[18px]">
            {{ signature.nom }}
          </span>
        </div>
        <div class="mt-3 h-20 rounded-sm border border-line-2" />
        <p class="mt-1 text-[10px] text-ink-4">Date et signature</p>
      </div>
    </section>

    <footer class="mt-10 flex justify-between border-t border-line-2 pt-2 text-[9.5px] text-ink-4">
      <span>{{ nomEntreprise }} · {{ sortie.reference }}</span>
      <span>Édité le {{ editeLe }}</span>
    </footer>
  </article>
</template>
