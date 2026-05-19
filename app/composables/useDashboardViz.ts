// Données d'analyse par période — représentatives en attendant des agrégats
// serveur dédiés (l'API /api/dashboard ne fournit pas encore de séries).

export interface PeriodData {
  label: string
  sub: string
  deltaSub: string
  ticks: string[]
  series: { entrees: (number | null)[]; sorties: (number | null)[] }
  kpi: { mvmts: number; entrees: number; sorties: number; valEntree: number; valSortie: number }
  delta: { mvmts: string; entrees: string; sorties: string; valEntree: string; valSortie: string }
}

export const PERIOD_DATA: Record<string, PeriodData> = {
  jour: {
    label: 'Jour',
    sub: "Aujourd'hui",
    deltaSub: 'vs hier',
    ticks: ['00', '04', '08', '12', '16', '20'],
    series: {
      entrees: [0, 0, 2, 5, 4, 8, 3, 4, 3, 7, 2, 1],
      sorties: [0, 1, 1, 3, 7, 9, 3, 2, 3, 5, 2, 0],
    },
    kpi: { mvmts: 47, entrees: 22, sorties: 25, valEntree: 156800, valSortie: 124300 },
    delta: { mvmts: '+9', entrees: '+4', sorties: '+5', valEntree: '+24K', valSortie: '+18K' },
  },
  semaine: {
    label: 'Semaine',
    sub: 'Cette semaine',
    deltaSub: 'vs sem. dernière',
    ticks: ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'],
    series: { entrees: [12, 18, 8, 15, 22, 9, 2], sorties: [15, 20, 14, 18, 25, 7, 1] },
    kpi: { mvmts: 186, entrees: 86, sorties: 100, valEntree: 842000, valSortie: 768000 },
    delta: { mvmts: '+12%', entrees: '+8%', sorties: '+14%', valEntree: '+5%', valSortie: '+9%' },
  },
  mois: {
    label: 'Mois',
    sub: 'Ce mois',
    deltaSub: 'vs mois dernier',
    ticks: ['01', '05', '10', '15', '20', '25', '30'],
    series: {
      entrees: [
        8, 5, 12, 6, 9, 11, 4, 7, 15, 3, 10, 8, 6, 14, 9, 11, 5, 7, 12, 8, 10, 6, 4, 9, 11, 7, 5, 8,
        6, 3,
      ],
      sorties: [
        10, 7, 9, 8, 11, 5, 3, 12, 8, 6, 14, 5, 4, 11, 10, 7, 9, 5, 8, 12, 6, 4, 8, 11, 3, 7, 9, 5,
        6, 2,
      ],
    },
    kpi: { mvmts: 524, entrees: 238, sorties: 286, valEntree: 3284600, valSortie: 2956400 },
    delta: { mvmts: '+18%', entrees: '+22%', sorties: '+14%', valEntree: '+12%', valSortie: '+8%' },
  },
  annee: {
    label: 'Année',
    sub: '2026 (YTD)',
    deltaSub: 'vs 2025',
    ticks: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUI', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'],
    series: {
      entrees: [180, 210, 240, 195, 280, null, null, null, null, null, null, null],
      sorties: [165, 200, 220, 210, 270, null, null, null, null, null, null, null],
    },
    kpi: { mvmts: 2186, entrees: 1105, sorties: 1081, valEntree: 18450000, valSortie: 16280000 },
    delta: {
      mvmts: '+34%',
      entrees: '+38%',
      sorties: '+30%',
      valEntree: '+34%',
      valSortie: '+27%',
    },
  },
}

export const TOP_CATEGORIES = [
  { nom: 'Maçonnerie', valeur: 198500, sub: '42 mvts' },
  { nom: 'Électricité', valeur: 156200, sub: '38 mvts' },
  { nom: 'Plomberie', valeur: 132800, sub: '51 mvts' },
  { nom: 'Ciment', valeur: 98400, sub: '22 mvts' },
  { nom: 'Outillage', valeur: 86700, sub: '28 mvts' },
  { nom: 'Peinture', valeur: 64200, sub: '18 mvts' },
]

export const TOP_CHANTIERS = [
  { nom: 'Chantier Adjamé', valeur: 142800, sub: '24 sorties' },
  { nom: 'Chantier Marcory', valeur: 118200, sub: '19 sorties' },
  { nom: 'Chantier Yopougon', valeur: 96400, sub: '22 sorties' },
  { nom: 'Chantier Bingerville', valeur: 78900, sub: '14 sorties' },
  { nom: 'Chantier Plateau', valeur: 54600, sub: '11 sorties' },
  { nom: 'Chantier Adjamé II', valeur: 41200, sub: '9 sorties' },
]
