import { db } from '../db'
import * as schema from '../db/schema'
import { generateCommandeReference, generateId } from './helpers'

type NouvelArticle = typeof schema.articles.$inferInsert & {
  id: string
  prixUnitaire: number
  stockActuel: number
}
type NouvelleLigne = typeof schema.lignesSortie.$inferInsert & { id: string }
type Quantite = [NouvelArticle, number]

interface Vente {
  date: Date
  clientId: string
  chantierId?: string
  beneficiaireId?: string
  objet: string
  conditions: 'comptant' | 'credit'
  echeance?: Date
  lignes: Quantite[]
  // Absent : rien d'encaissé. Sans montant : le total du bon.
  encaissement?: { montant?: number; mode: string; reference?: string }
}

const JOUR = 24 * 60 * 60 * 1000
const ilYa = (jours: number) => new Date(Date.now() - jours * JOUR)
const dansJours = (jours: number) => new Date(Date.now() + jours * JOUR)
const horodatage = (date: Date) => date.toISOString().replace('T', ' ').slice(0, 19)
const jour = (date: Date) => date.toISOString().slice(0, 10)

function referenceBon(date: Date): string {
  const suffixe = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X')
  return `BS-${jour(date).replaceAll('-', '')}-${suffixe}`
}

function article(
  reference: string,
  nom: string,
  categorieId: string,
  unite: string,
  prix: number,
  stock: number,
): NouvelArticle {
  return {
    id: generateId(),
    reference,
    nom,
    categorieId,
    unite,
    prixUnitaire: prix,
    stockActuel: stock,
    seuilAlerte: 5,
  }
}

// Matériel prêté aux chantiers : on attend qu'il revienne au magasin. Il ne se
// garde pas en réserve comme un consommable, l'alerte attend le dernier exemplaire.
function outil(...parametres: Parameters<typeof article>): NouvelArticle {
  return { ...article(...parametres), type: 'equipement', retournable: true, seuilAlerte: 1 }
}

/**
 * Rejoue l'historique comme le fait l'app : chaque mouvement fait varier le
 * stock, et chaque ligne de bon fige le stock restant au moment de la vente.
 * Le stock final des articles découle ainsi des mouvements, et le détail
 * d'une transaction retombe juste.
 */
class RegistreDemo {
  readonly bons: (typeof schema.sorties.$inferInsert)[] = []
  readonly lignes: NouvelleLigne[] = []
  readonly mouvements: (typeof schema.mouvements.$inferInsert)[] = []
  readonly retours: (typeof schema.retours.$inferInsert)[] = []
  readonly reglements: (typeof schema.reglements.$inferInsert)[] = []
  private readonly stock: Map<string, number>

  constructor(articles: NouvelArticle[]) {
    this.stock = new Map(articles.map((a) => [a.id, a.stockActuel]))
  }

  receptionner(date: Date, fournisseurId: string, bonLivraison: string, livraisons: Quantite[]) {
    for (const [article, quantite] of livraisons) {
      this.bouger(article.id, quantite)
      this.mouvements.push({
        id: generateId(),
        articleId: article.id,
        type: 'entree',
        quantite,
        fournisseurId,
        bonLivraison,
        motif: 'Réapprovisionnement',
        createdAt: horodatage(date),
      })
    }
  }

  vendre(vente: Vente): NouvelleLigne[] {
    const sortieId = generateId()
    const reference = referenceBon(vente.date)
    const lignes = vente.lignes.map(([article, quantite]) => ({
      id: generateId(),
      sortieId,
      articleId: article.id,
      quantite,
      prixUnitaire: article.prixUnitaire,
      stockApres: this.bouger(article.id, -quantite),
    }))
    const montantTotal = lignes.reduce((total, l) => total + l.quantite * l.prixUnitaire, 0)
    const encaisse = vente.encaissement ? (vente.encaissement.montant ?? montantTotal) : 0

    this.bons.push({
      id: sortieId,
      reference,
      clientId: vente.clientId,
      chantierId: vente.chantierId ?? null,
      beneficiaireId: vente.beneficiaireId ?? null,
      dateSortie: jour(vente.date),
      dateEcheance: vente.echeance ? jour(vente.echeance) : null,
      objet: vente.objet,
      montantTotal,
      conditionsReglement: vente.conditions,
      statutPaiement: encaisse <= 0 ? 'impaye' : encaisse >= montantTotal ? 'paye' : 'partiel',
      montantPaye: encaisse,
      createdAt: horodatage(vente.date),
    })
    this.lignes.push(...lignes)
    for (const ligne of lignes) {
      this.mouvements.push({
        id: generateId(),
        articleId: ligne.articleId,
        type: 'sortie',
        quantite: ligne.quantite,
        sortieId,
        motif: `Bon de sortie ${reference}`,
        createdAt: horodatage(vente.date),
      })
    }
    if (vente.encaissement && encaisse > 0) {
      this.reglements.push({
        id: generateId(),
        sortieId,
        montant: encaisse,
        dateReglement: jour(vente.date),
        mode: vente.encaissement.mode,
        reference: vente.encaissement.reference ?? null,
        notes: "Encaissé à l'émission du bon",
        createdAt: horodatage(vente.date),
      })
    }
    return lignes
  }

  rendre(date: Date, ligne: NouvelleLigne, quantite: number) {
    this.bouger(ligne.articleId, quantite)
    const bon = this.bons.find((b) => b.id === ligne.sortieId)!
    this.retours.push({
      id: generateId(),
      ligneSortieId: ligne.id,
      quantite,
      dateRetour: jour(date),
      etat: 'bon',
      createdAt: horodatage(date),
    })
    this.mouvements.push({
      id: generateId(),
      articleId: ligne.articleId,
      type: 'retour',
      quantite,
      sortieId: ligne.sortieId,
      motif: `Retour matériel · bon ${bon.reference}`,
      createdAt: horodatage(date),
    })
  }

  enStock(article: NouvelArticle): NouvelArticle {
    return { ...article, stockActuel: this.stock.get(article.id)! }
  }

  private bouger(articleId: string, variation: number): number {
    const stock = this.stock.get(articleId)! + variation
    this.stock.set(articleId, stock)
    return stock
  }
}

function referentielsDemo() {
  const categories = {
    plomberie: {
      id: generateId(),
      nom: 'Plomberie',
      description: 'Tuyaux, raccords, robinetterie',
    },
    electricite: { id: generateId(), nom: 'Électricité', description: 'Câbles, appareillage' },
    maconnerie: { id: generateId(), nom: 'Maçonnerie', description: 'Ciment, parpaings' },
    peinture: { id: generateId(), nom: 'Peinture', description: 'Peintures, enduits' },
    outillage: { id: generateId(), nom: 'Outillage', description: 'Matériel prêté aux chantiers' },
  }
  const sousCategories = {
    tuyaux: { id: generateId(), nom: 'Tuyaux PVC', parentId: categories.plomberie.id },
    cables: { id: generateId(), nom: 'Câbles', parentId: categories.electricite.id },
  }
  const fournisseurs = {
    materiaux: {
      id: generateId(),
      nom: 'Matériaux BTP CI',
      telephone: '07 07 07 07 07',
      email: 'contact@materiauxbtp.ci',
      adresse: 'Yopougon, zone industrielle',
      ville: 'Abidjan',
      ncc: 'CI-2018-0042187 T',
    },
    quincaillerie: {
      id: generateId(),
      nom: 'Quincaillerie du Plateau',
      telephone: '05 05 05 05 05',
      adresse: 'Plateau, avenue Chardy',
      ville: 'Abidjan',
    },
    electro: {
      id: generateId(),
      nom: 'Électro Distribution CI',
      telephone: '01 01 01 01 01',
      email: 'ventes@electrodist.ci',
      adresse: 'Marcory, zone 4',
      ville: 'Abidjan',
      ncc: 'CI-2020-0117754 B',
    },
  }
  const clients = {
    kouassi: {
      id: generateId(),
      nom: 'Entreprise Kouassi BTP',
      type: 'entreprise',
      telephone: '07 11 22 33 44',
      email: 'kouassi@btp.ci',
      adresse: 'Cocody Riviera 3',
      ville: 'Abidjan',
      ncc: 'CI-2016-0098321 M',
    },
    palmiers: {
      id: generateId(),
      nom: 'SCI Les Palmiers',
      type: 'entreprise',
      telephone: '05 55 66 77 88',
      adresse: 'Bingerville',
      ville: 'Abidjan',
    },
    traore: {
      id: generateId(),
      nom: 'Traoré Ibrahim',
      type: 'particulier',
      telephone: '01 23 45 67 89',
      adresse: 'Abobo Baoulé',
      ville: 'Abidjan',
    },
  }
  const chantiers = {
    riviera: {
      id: generateId(),
      nom: 'Cocody Riviera 3 (R+4)',
      ville: 'Abidjan',
      adresse: 'Riviera 3, carrefour Palmeraie',
      clientId: clients.kouassi.id,
      budgetAlloue: 2_500_000,
      dateDebut: jour(ilYa(40)),
      dateFinPrevue: jour(dansJours(80)),
    },
    bingerville: {
      id: generateId(),
      nom: 'Bingerville, villa témoin',
      ville: 'Bingerville',
      clientId: clients.palmiers.id,
      budgetAlloue: 1_200_000,
      dateDebut: jour(ilYa(15)),
      dateFinPrevue: jour(dansJours(45)),
    },
  }
  const beneficiaires = {
    koffi: {
      id: generateId(),
      nom: 'Koffi Assamoi',
      fonction: "Chef d'équipe",
      telephone: '07 08 09 10 11',
    },
    aya: {
      id: generateId(),
      nom: 'Aya Traoré',
      fonction: 'Conductrice de travaux',
      telephone: '05 44 33 22 11',
    },
    yao: { id: generateId(), nom: 'Yao Kouamé', fonction: 'Maçon', telephone: '01 98 76 54 32' },
  }
  return { categories, sousCategories, fournisseurs, clients, chantiers, beneficiaires }
}

function articlesDemo(r: ReturnType<typeof referentielsDemo>) {
  const { categories: c, sousCategories: s } = r
  return {
    tuyau: article('PLB-001', 'Tuyau PVC 32mm', s.tuyaux.id, 'mètre', 1500, 120),
    coude: article('PLB-002', 'Coude PVC 90° 32mm', s.tuyaux.id, 'pièce', 350, 80),
    robinet: article('PLB-003', 'Robinet à boisseau 1/2"', c.plomberie.id, 'pièce', 2500, 10),
    cable: article('ELC-001', 'Câble H07VR 2.5mm² rouge', s.cables.id, 'mètre', 450, 200),
    interrupteur: article('ELC-002', 'Interrupteur simple', c.electricite.id, 'pièce', 1200, 25),
    prise: article('ELC-003', 'Prise 2P+T encastrable', c.electricite.id, 'pièce', 1800, 20),
    ciment: article('MAC-001', 'Ciment Portland CEM I 25kg', c.maconnerie.id, 'sac', 4500, 30),
    parpaing: article('MAC-002', 'Parpaing creux 20x20x50', c.maconnerie.id, 'pièce', 350, 500),
    peinture: article('PNT-001', 'Peinture blanche mat 10L', c.peinture.id, 'pièce', 18000, 15),
    rouleau: article('PNT-002', 'Rouleau peinture 180mm', c.peinture.id, 'pièce', 2500, 25),
    perceuse: outil('OUT-001', 'Perceuse à percussion 800W', c.outillage.id, 'pièce', 68000, 6),
    brouette: outil('OUT-002', 'Brouette chantier 100L', c.outillage.id, 'pièce', 35000, 8),
    echafaudage: outil('OUT-003', 'Échafaudage tubulaire 2m', c.outillage.id, 'lot', 185000, 4),
  }
}

// Un mois d'activité : chaque écran a de quoi montrer son usage.
function historiqueDemo(
  r: ReturnType<typeof referentielsDemo>,
  a: ReturnType<typeof articlesDemo>,
): RegistreDemo {
  const registre = new RegistreDemo(Object.values(a))
  const { fournisseurs, clients, chantiers, beneficiaires } = r

  registre.receptionner(ilYa(30), fournisseurs.materiaux.id, 'BL-2026-0418', [
    [a.ciment, 40],
    [a.tuyau, 50],
  ])

  registre.vendre({
    date: ilYa(25),
    clientId: clients.kouassi.id,
    chantierId: chantiers.riviera.id,
    beneficiaireId: beneficiaires.koffi.id,
    objet: 'Gros œuvre niveau R+2',
    conditions: 'comptant',
    lignes: [
      [a.ciment, 20],
      [a.parpaing, 150],
    ],
    encaissement: { mode: 'orange_money', reference: 'MP2608.1532.B45871' },
  })

  // Crédit en retard : l'échéance est passée, et seules les perceuses sont
  // revenues du chantier.
  const [perceuses] = registre.vendre({
    date: ilYa(18),
    clientId: clients.kouassi.id,
    chantierId: chantiers.riviera.id,
    beneficiaireId: beneficiaires.koffi.id,
    objet: 'Outillage et câblage niveau R+3',
    conditions: 'credit',
    echeance: ilYa(3),
    lignes: [
      [a.perceuse, 2],
      [a.echafaudage, 2],
      [a.cable, 60],
    ],
    encaissement: { montant: 100_000, mode: 'especes' },
  })
  registre.rendre(ilYa(6), perceuses!, 2)

  const brouettes = registre.vendre({
    date: ilYa(10),
    clientId: clients.palmiers.id,
    chantierId: chantiers.bingerville.id,
    beneficiaireId: beneficiaires.aya.id,
    objet: 'Plomberie de la villa témoin',
    conditions: 'credit',
    echeance: dansJours(20),
    lignes: [
      [a.tuyau, 40],
      [a.coude, 30],
      [a.robinet, 6],
      [a.brouette, 2],
    ],
  })[3]
  registre.rendre(ilYa(2), brouettes!, 1)

  registre.vendre({
    date: ilYa(4),
    clientId: clients.traore.id,
    objet: 'Peinture du salon',
    conditions: 'comptant',
    lignes: [
      [a.peinture, 2],
      [a.rouleau, 2],
    ],
    encaissement: { mode: 'wave', reference: 'T_7F3K2Q9X' },
  })

  registre.receptionner(ilYa(2), fournisseurs.electro.id, 'BL-ED-0932', [
    [a.interrupteur, 20],
    [a.prise, 20],
  ])

  return registre
}

function commandeDemo(r: ReturnType<typeof referentielsDemo>, a: ReturnType<typeof articlesDemo>) {
  const commande = {
    id: generateId(),
    reference: generateCommandeReference(),
    fournisseurId: r.fournisseurs.electro.id,
    statut: 'envoyee',
    dateCommande: jour(ilYa(1)),
    dateLivraisonPrevue: jour(dansJours(5)),
    notes: 'Réassort électricité pour le chantier Riviera',
  }
  const lignes = [a.cable, a.interrupteur].map((article, i) => ({
    id: generateId(),
    commandeId: commande.id,
    articleId: article.id,
    quantite: i === 0 ? 300 : 50,
    quantiteRecue: 0,
    prixUnitaire: article.prixUnitaire,
  }))
  return { commande, lignes }
}

/**
 * Jeu de données d'exemple (contexte Côte d'Ivoire, FCFA) inséré au tout
 * premier lancement de l'app packagée : vente réglée par mobile money, crédit
 * en retard, matériel prêté sur un chantier et en partie rendu, commande
 * fournisseur envoyée, article sous son seuil d'alerte. Effaçable depuis
 * Réglages. Tout part en un seul batch : un premier lancement interrompu ne
 * laisse pas une démo à moitié écrite.
 */
export async function seedDemo() {
  const r = referentielsDemo()
  const a = articlesDemo(r)
  const registre = historiqueDemo(r, a)
  const { commande, lignes } = commandeDemo(r, a)

  await db.batch([
    db.insert(schema.categories).values(Object.values(r.categories)),
    db.insert(schema.categories).values(Object.values(r.sousCategories)),
    db.insert(schema.fournisseurs).values(Object.values(r.fournisseurs)),
    db.insert(schema.clients).values(Object.values(r.clients)),
    db.insert(schema.chantiers).values(Object.values(r.chantiers)),
    db.insert(schema.beneficiaires).values(Object.values(r.beneficiaires)),
    db.insert(schema.articles).values(Object.values(a).map((article) => registre.enStock(article))),
    db.insert(schema.sorties).values(registre.bons),
    db.insert(schema.lignesSortie).values(registre.lignes),
    db.insert(schema.mouvements).values(registre.mouvements),
    db.insert(schema.retours).values(registre.retours),
    db.insert(schema.reglements).values(registre.reglements),
    db.insert(schema.commandes).values(commande),
    db.insert(schema.lignesCommande).values(lignes),
  ])
}
