import { and, gte, lt, eq } from 'drizzle-orm'
import { db } from '../../db'
import { mouvements, articles } from '../../db/schema'

type Periode = 'jour' | 'semaine' | 'annee' | 'mois'

interface Mvt {
  createdAt: string
  type: string
  quantite: number
  prix: number
}

function parseDate(s: string): Date {
  return new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
}

// Fenêtre [début, fin[ et fenêtre précédente de même durée pour les deltas
function fenetres(periode: Periode, now: Date) {
  const d = new Date(now)
  if (periode === 'jour') {
    const debut = new Date(d)
    debut.setHours(0, 0, 0, 0)
    const fin = new Date(debut)
    fin.setDate(fin.getDate() + 1)
    const prevDebut = new Date(debut)
    prevDebut.setDate(prevDebut.getDate() - 1)
    return { debut, fin, prevDebut, prevFin: debut }
  }
  if (periode === 'semaine') {
    const debut = new Date(d)
    const jour = (debut.getDay() + 6) % 7 // lundi = 0
    debut.setDate(debut.getDate() - jour)
    debut.setHours(0, 0, 0, 0)
    const fin = new Date(debut)
    fin.setDate(fin.getDate() + 7)
    const prevDebut = new Date(debut)
    prevDebut.setDate(prevDebut.getDate() - 7)
    return { debut, fin, prevDebut, prevFin: debut }
  }
  if (periode === 'annee') {
    const debut = new Date(d.getFullYear(), 0, 1)
    const fin = new Date(d.getFullYear() + 1, 0, 1)
    const prevDebut = new Date(d.getFullYear() - 1, 0, 1)
    return { debut, fin, prevDebut, prevFin: debut }
  }
  const debut = new Date(d.getFullYear(), d.getMonth(), 1)
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  const prevDebut = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return { debut, fin, prevDebut, prevFin: debut }
}

function bucketsConfig(periode: Periode, now: Date) {
  if (periode === 'jour') {
    return { n: 12, ticks: ['00', '04', '08', '12', '16', '20'], step: 'h2' as const }
  }
  if (periode === 'semaine') {
    return { n: 7, ticks: ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'], step: 'day' as const }
  }
  if (periode === 'annee') {
    return {
      n: 12,
      ticks: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'],
      step: 'month' as const,
    }
  }
  const jours = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return {
    n: jours,
    ticks: ['01', '05', '10', '15', '20', '25', '30'],
    step: 'dayOfMonth' as const,
  }
}

// `ticks` étiquette l'axe de façon clairsemée (7 repères pour 31 jours) ;
// l'infobulle, elle, doit nommer le point exact survolé. D'où une étiquette
// par point, distincte des repères d'axe.
function libellesPoints(periode: Periode, n: number, now: Date): string[] {
  if (periode === 'jour') {
    return Array.from({ length: n }, (_, i) => `${String(i * 2).padStart(2, '0')} h`)
  }
  if (periode === 'semaine') {
    return ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  }
  if (periode === 'annee') {
    return [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ]
  }
  const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(now)
  return Array.from({ length: n }, (_, i) => `${i + 1} ${mois}`)
}

function indexBucket(date: Date, periode: Periode, debut: Date): number {
  if (periode === 'jour') return Math.floor(date.getHours() / 2)
  if (periode === 'semaine') return Math.floor((date.getTime() - debut.getTime()) / 86400000)
  if (periode === 'annee') return date.getMonth()
  return date.getDate() - 1
}

function pct(courant: number, precedent: number): string {
  if (precedent === 0) return courant > 0 ? '+100%' : '+0%'
  const p = Math.round(((courant - precedent) / precedent) * 100)
  return (p >= 0 ? '+' : '') + p + '%'
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const periode = (
    ['jour', 'semaine', 'mois', 'annee'].includes(q.periode as string) ? q.periode : 'mois'
  ) as Periode
  const now = new Date()
  const { debut, fin, prevDebut, prevFin } = fenetres(periode, now)
  const { n, ticks } = bucketsConfig(periode, now)

  const rows = (await db
    .select({
      createdAt: mouvements.createdAt,
      type: mouvements.type,
      quantite: mouvements.quantite,
      prix: articles.prixUnitaire,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .where(
      and(
        gte(mouvements.createdAt, prevDebut.toISOString().slice(0, 19).replace('T', ' ')),
        lt(mouvements.createdAt, fin.toISOString().slice(0, 19).replace('T', ' ')),
      ),
    )) as { createdAt: string; type: string; quantite: number; prix: number | null }[]

  const courant: Mvt[] = []
  const precedent: Mvt[] = []
  for (const r of rows) {
    const d = parseDate(r.createdAt)
    const m: Mvt = { createdAt: r.createdAt, type: r.type, quantite: r.quantite, prix: r.prix ?? 0 }
    if (d >= debut && d < fin) courant.push(m)
    else if (d >= prevDebut && d < prevFin) precedent.push(m)
  }

  const entrees = new Array(n).fill(0)
  const sorties = new Array(n).fill(0)
  // Année : null pour les mois futurs
  if (periode === 'annee') {
    for (let i = now.getMonth() + 1; i < 12; i++) {
      entrees[i] = null
      sorties[i] = null
    }
  }
  let nbE = 0,
    nbS = 0,
    valE = 0,
    valS = 0
  for (const m of courant) {
    const idx = indexBucket(parseDate(m.createdAt), periode, debut)
    if (idx < 0 || idx >= n) continue
    if (m.type === 'entree') {
      if (entrees[idx] !== null) entrees[idx] += m.quantite
      nbE += m.quantite
      valE += m.quantite * m.prix
    } else {
      if (sorties[idx] !== null) sorties[idx] += m.quantite
      nbS += m.quantite
      valS += m.quantite * m.prix
    }
  }

  let pE = 0,
    pS = 0,
    pVE = 0,
    pVS = 0
  for (const m of precedent) {
    if (m.type === 'entree') {
      pE += m.quantite
      pVE += m.quantite * m.prix
    } else {
      pS += m.quantite
      pVS += m.quantite * m.prix
    }
  }

  const sub: Record<Periode, string> = {
    jour: "Aujourd'hui",
    semaine: 'Cette semaine',
    mois: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now),
    annee: `${now.getFullYear()} (YTD)`,
  }
  const deltaSub: Record<Periode, string> = {
    jour: 'vs hier',
    semaine: 'vs sem. dernière',
    mois: 'vs mois dernier',
    annee: 'vs an dernier',
  }
  const label: Record<Periode, string> = {
    jour: 'Jour',
    semaine: 'Semaine',
    mois: 'Mois',
    annee: 'Année',
  }

  return {
    label: label[periode],
    sub: sub[periode],
    deltaSub: deltaSub[periode],
    ticks,
    libelles: libellesPoints(periode, n, now),
    series: { entrees, sorties },
    kpi: {
      mvmts: nbE + nbS,
      entrees: nbE,
      sorties: nbS,
      valEntree: Math.round(valE),
      valSortie: Math.round(valS),
    },
    delta: {
      mvmts: pct(nbE + nbS, pE + pS),
      entrees: pct(nbE, pE),
      sorties: pct(nbS, pS),
      valEntree: pct(valE, pVE),
      valSortie: pct(valS, pVS),
    },
  }
})
