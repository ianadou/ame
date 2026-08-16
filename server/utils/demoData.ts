import { db } from '../db'
import * as schema from '../db/schema'
import { generateId, generateSortieReference, generateCommandeReference } from './helpers'

/**
 * Jeu de données d'exemple (statique, contexte Côte d'Ivoire / FCFA) inséré
 * au tout premier lancement de l'app packagée, pour que l'utilisateur
 * découvre l'outil avec du contenu plutôt qu'une base vide. Effaçable via
 * POST /api/maintenance/reset. Respecte les contraintes CHECK (prix > 0,
 * stock >= 0, quantités > 0).
 */
export async function seedDemo() {
  const cats = {
    plomberie: generateId(),
    elec: generateId(),
    maconnerie: generateId(),
    peinture: generateId(),
  }
  await db.insert(schema.categories).values([
    { id: cats.plomberie, nom: 'Plomberie', description: 'Tuyaux, raccords, robinetterie' },
    { id: cats.elec, nom: 'Électricité', description: 'Câbles, appareillage' },
    { id: cats.maconnerie, nom: 'Maçonnerie', description: 'Ciment, parpaings' },
    { id: cats.peinture, nom: 'Peinture', description: 'Peintures, enduits' },
  ])
  const sousTuyaux = generateId()
  await db.insert(schema.categories).values([
    { id: sousTuyaux, nom: 'Tuyaux PVC', parentId: cats.plomberie },
    { id: generateId(), nom: 'Câbles', parentId: cats.elec },
  ])

  const fournisseurs = [
    {
      id: generateId(),
      nom: 'Matériaux BTP CI',
      telephone: '07 07 07 07 07',
      email: 'contact@materiauxbtp.ci',
      adresse: 'Yopougon Zone Industrielle',
      notes: null,
    },
    {
      id: generateId(),
      nom: 'Quincaillerie du Plateau',
      telephone: '05 05 05 05 05',
      email: null,
      adresse: 'Plateau, Avenue Chardy',
      notes: null,
    },
    {
      id: generateId(),
      nom: 'Électro Distribution CI',
      telephone: '01 01 01 01 01',
      email: 'ventes@electrodist.ci',
      adresse: 'Marcory Zone 4',
      notes: null,
    },
  ]
  await db.insert(schema.fournisseurs).values(fournisseurs)

  const clients = [
    {
      id: generateId(),
      nom: 'Entreprise Kouassi BTP',
      type: 'entreprise',
      telephone: '07 11 22 33 44',
      email: 'kouassi@btp.ci',
      adresse: 'Cocody Riviera 3',
      ville: 'Abidjan',
      notes: null,
    },
    {
      id: generateId(),
      nom: 'SCI Les Palmiers',
      type: 'entreprise',
      telephone: '05 55 66 77 88',
      email: null,
      adresse: 'Bingerville',
      ville: 'Abidjan',
      notes: null,
    },
    {
      id: generateId(),
      nom: 'Traoré Ibrahim',
      type: 'particulier',
      telephone: '01 23 45 67 89',
      email: null,
      adresse: 'Abobo Baoulé',
      ville: 'Abidjan',
      notes: null,
    },
  ]
  await db.insert(schema.clients).values(clients)

  const A = (
    reference: string,
    nom: string,
    categorieId: string,
    unite: string,
    prix: number,
    stock: number,
  ) => ({
    id: generateId(),
    reference,
    nom,
    categorieId,
    unite,
    prixUnitaire: prix,
    stockActuel: stock,
    seuilAlerte: 5,
    emplacement: null,
    notes: null,
  })
  const articles = [
    A('PLB-001', 'Tuyau PVC 32mm', sousTuyaux, 'mètre', 1500, 120),
    A('PLB-002', 'Coude PVC 90° 32mm', sousTuyaux, 'pièce', 350, 80),
    A('PLB-003', 'Robinet à boisseau 1/2"', cats.plomberie, 'pièce', 2500, 30),
    A('ELC-001', 'Câble H07VR 2.5mm² rouge', cats.elec, 'mètre', 450, 200),
    A('ELC-002', 'Interrupteur simple', cats.elec, 'pièce', 1200, 45),
    A('ELC-003', 'Prise 2P+T encastrable', cats.elec, 'pièce', 1800, 40),
    A('MAC-001', 'Ciment Portland CEM I 25kg', cats.maconnerie, 'sac', 4500, 60),
    A('MAC-002', 'Parpaing creux 20x20x50', cats.maconnerie, 'pièce', 350, 500),
    A('PNT-001', 'Peinture blanche mat 10L', cats.peinture, 'pièce', 18000, 15),
    A('PNT-002', 'Rouleau peinture 180mm', cats.peinture, 'pièce', 2500, 25),
  ]
  await db.insert(schema.articles).values(articles)

  // Entrées de stock (réceptions fournisseur)
  const now = new Date()
  const iso = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19)
  await db.insert(schema.mouvements).values([
    {
      id: generateId(),
      articleId: articles[0].id,
      type: 'entree',
      quantite: 50,
      fournisseurId: fournisseurs[0].id,
      sortieId: null,
      bonLivraison: 'BL-001',
      motif: 'Réapprovisionnement',
      createdAt: iso(new Date(now.getTime() - 10 * 86400000)),
    },
    {
      id: generateId(),
      articleId: articles[6].id,
      type: 'entree',
      quantite: 30,
      fournisseurId: fournisseurs[0].id,
      sortieId: null,
      bonLivraison: 'BL-002',
      motif: null,
      createdAt: iso(new Date(now.getTime() - 7 * 86400000)),
    },
  ])

  // Bon de sortie exemple (client, lignes, mouvements rattachés)
  const sortieId = generateId()
  const ligne1 = { article: articles[0], qte: 10 }
  const ligne2 = { article: articles[6], qte: 5 }
  const montant =
    ligne1.qte * ligne1.article.prixUnitaire + ligne2.qte * ligne2.article.prixUnitaire
  await db.insert(schema.sorties).values({
    id: sortieId,
    reference: generateSortieReference(),
    clientId: clients[0].id,
    dateSortie: now.toISOString().slice(0, 10),
    objet: 'Livraison chantier Riviera',
    montantTotal: montant,
    conditionsReglement: 'comptant',
    statutPaiement: 'paye',
    montantPaye: montant,
    notes: null,
  })
  await db.insert(schema.lignesSortie).values([
    {
      id: generateId(),
      sortieId,
      articleId: ligne1.article.id,
      quantite: ligne1.qte,
      prixUnitaire: ligne1.article.prixUnitaire,
      stockApres: ligne1.article.stockActuel - ligne1.qte,
    },
    {
      id: generateId(),
      sortieId,
      articleId: ligne2.article.id,
      quantite: ligne2.qte,
      prixUnitaire: ligne2.article.prixUnitaire,
      stockApres: ligne2.article.stockActuel - ligne2.qte,
    },
  ])
  await db.insert(schema.mouvements).values([
    {
      id: generateId(),
      articleId: ligne1.article.id,
      type: 'sortie',
      quantite: ligne1.qte,
      fournisseurId: null,
      sortieId,
      bonLivraison: null,
      motif: 'Bon de sortie',
      createdAt: iso(now),
    },
    {
      id: generateId(),
      articleId: ligne2.article.id,
      type: 'sortie',
      quantite: ligne2.qte,
      fournisseurId: null,
      sortieId,
      bonLivraison: null,
      motif: 'Bon de sortie',
      createdAt: iso(now),
    },
  ])

  // Commande fournisseur exemple (brouillon)
  const commandeId = generateId()
  await db.insert(schema.commandes).values({
    id: commandeId,
    reference: generateCommandeReference(),
    fournisseurId: fournisseurs[0].id,
    statut: 'brouillon',
    dateCommande: now.toISOString().slice(0, 10),
    dateLivraisonPrevue: null,
    notes: 'Commande d’exemple',
  })
  await db.insert(schema.lignesCommande).values([
    {
      id: generateId(),
      commandeId,
      articleId: articles[1].id,
      quantite: 100,
      quantiteRecue: 0,
      prixUnitaire: articles[1].prixUnitaire,
    },
    {
      id: generateId(),
      commandeId,
      articleId: articles[3].id,
      quantite: 300,
      quantiteRecue: 0,
      prixUnitaire: articles[3].prixUnitaire,
    },
  ])
}
