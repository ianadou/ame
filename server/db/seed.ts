import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { faker } from '@faker-js/faker'
import * as schema from './schema'

const client = createClient({ url: 'file:./dev.db' })
const db = drizzle(client, { schema })

function id() {
  return crypto.randomUUID()
}

// Contexte Côte d'Ivoire (pas de données françaises)
const communesAbidjan = [
  'Cocody',
  'Yopougon',
  'Abobo',
  'Plateau',
  'Marcory',
  'Treichville',
  'Adjamé',
  'Koumassi',
  'Port-Bouët',
  'Bingerville',
]

function telephoneIvoirien() {
  const prefixe = faker.helpers.arrayElement(['01', '05', '07', '25', '27'])
  const reste = faker.string.numeric(8)
  return `${prefixe} ${reste.slice(0, 2)} ${reste.slice(2, 4)} ${reste.slice(4, 6)} ${reste.slice(6, 8)}`
}

function adresseIvoirienne() {
  const commune = faker.helpers.arrayElement(communesAbidjan)
  const quartier = faker.number.int({ min: 1, max: 4 })
  return `${commune} ${quartier}, Rue ${faker.string.alpha({ length: 1, casing: 'upper' })}${faker.number.int({ min: 10, max: 99 })}, Abidjan`
}

async function seed() {
  console.log('Seeding database...')

  // Nettoyage (ordre des dépendances : enfants avant parents)
  await db.delete(schema.lignesCommande)
  await db.delete(schema.commandes)
  await db.delete(schema.lignesSortie)
  await db.delete(schema.mouvements)
  await db.delete(schema.sorties)
  await db.delete(schema.articles)
  await db.delete(schema.clients)
  await db.delete(schema.fournisseurs)
  await db.delete(schema.categories)
  console.log('  tables vidées')

  // Categories
  const categoriesData = [
    { id: id(), nom: 'Plomberie', description: 'Tuyaux, raccords, robinetterie' },
    { id: id(), nom: 'Électricité', description: 'Câbles, interrupteurs, prises' },
    { id: id(), nom: 'Maçonnerie', description: 'Ciment, parpaings, briques' },
    { id: id(), nom: 'Peinture', description: 'Peintures, enduits, rouleaux' },
    { id: id(), nom: 'Outillage', description: 'Outils manuels et électriques' },
    { id: id(), nom: 'Menuiserie', description: 'Bois, vis, charnières' },
  ]

  await db.insert(schema.categories).values(categoriesData)
  console.log(`  ${categoriesData.length} catégories créées`)

  // Sous-catégories
  const sousCategories = [
    { id: id(), nom: 'Tuyaux PVC', parentId: categoriesData[0].id },
    { id: id(), nom: 'Raccords', parentId: categoriesData[0].id },
    { id: id(), nom: 'Câbles', parentId: categoriesData[1].id },
    { id: id(), nom: 'Appareillage', parentId: categoriesData[1].id },
    { id: id(), nom: 'Ciment', parentId: categoriesData[2].id },
    { id: id(), nom: 'Parpaings', parentId: categoriesData[2].id },
  ]

  await db.insert(schema.categories).values(sousCategories)
  console.log(`  ${sousCategories.length} sous-catégories créées`)

  const allCategories = [...categoriesData, ...sousCategories]

  // Fournisseurs
  const fournisseursData = Array.from({ length: 8 }, () => ({
    id: id(),
    nom: `${faker.company.name()} CI`,
    contact: faker.person.fullName(),
    telephone: telephoneIvoirien(),
    email: faker.internet.email({ provider: 'orange.ci' }),
    adresse: adresseIvoirienne(),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? null,
  }))

  await db.insert(schema.fournisseurs).values(fournisseursData)
  console.log(`  ${fournisseursData.length} fournisseurs créés`)

  // Clients
  const clientsData = Array.from({ length: 8 }, () => {
    const type = faker.helpers.arrayElement(['entreprise', 'entreprise', 'particulier'] as const)
    return {
      id: id(),
      nom: type === 'entreprise' ? `${faker.company.name()} BTP` : faker.person.fullName(),
      type,
      contact: type === 'entreprise' ? faker.person.fullName() : null,
      telephone: telephoneIvoirien(),
      email:
        faker.helpers.maybe(() => faker.internet.email({ provider: 'orange.ci' }), {
          probability: 0.6,
        }) ?? null,
      adresse: adresseIvoirienne(),
      ville: faker.helpers.arrayElement(communesAbidjan),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ?? null,
    }
  })

  await db.insert(schema.clients).values(clientsData)
  console.log(`  ${clientsData.length} clients créés`)

  // Articles
  const unites = ['pièce', 'mètre', 'kg', 'litre', 'sac', 'rouleau', 'lot']
  const prefixes: Record<string, string> = {
    Plomberie: 'PLB',
    Électricité: 'ELC',
    Maçonnerie: 'MAC',
    Peinture: 'PNT',
    Outillage: 'OUT',
    Menuiserie: 'MEN',
  }

  const articleNames = [
    'Tuyau PVC 32mm',
    'Tuyau PVC 50mm',
    'Coude PVC 90° 32mm',
    'Raccord T PVC 50mm',
    'Câble H07VR 2.5mm² rouge',
    'Câble H07VR 1.5mm² bleu',
    'Interrupteur simple',
    'Prise 2P+T encastrable',
    'Ciment Portland CEM I 25kg',
    'Parpaing creux 20x20x50',
    'Brique pleine 22x10.5x5.5',
    'Peinture blanche mat 10L',
    'Enduit de lissage 5kg',
    'Rouleau peinture 180mm',
    'Perceuse visseuse 18V',
    'Disqueuse 125mm',
    'Niveau à bulle 60cm',
    'Mètre ruban 5m',
    'Vis à bois 4x40 (boîte 200)',
    'Charnière inox 80mm',
    'Planche sapin 200x20x2cm',
    'Tasseau 40x40 2.4m',
    'Sac de sable 35kg',
    'Gravier 20/40 35kg',
    'Joint silicone blanc 310ml',
    'Scotch électricien',
    'Gaine ICTA 20mm',
    'Boîte de dérivation',
    'Robinet à boisseau 1/2',
    'Flexible inox 50cm',
  ]

  const articlesData = articleNames.map((nom, i) => {
    const cat = faker.helpers.arrayElement(allCategories)
    const parentCat = categoriesData.find((c) => c.id === cat.id) ?? categoriesData[0]
    const prefix = prefixes[parentCat.nom] ?? 'GEN'
    const stockActuel = faker.number.int({ min: 0, max: 150 })

    return {
      id: id(),
      reference: `${prefix}-${String(i + 1).padStart(3, '0')}`,
      nom,
      categorieId: cat.id,
      unite: faker.helpers.arrayElement(unites),
      prixUnitaire: parseFloat(faker.commerce.price({ min: 1, max: 200, dec: 2 })),
      stockActuel,
      seuilAlerte: faker.number.int({ min: 3, max: 15 }),
      emplacement: `${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}${faker.number.int({ min: 1, max: 5 })}-${faker.helpers.arrayElement(['Haut', 'Milieu', 'Bas'])}`,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }) ?? null,
    }
  })

  await db.insert(schema.articles).values(articlesData)
  console.log(`  ${articlesData.length} articles créés`)

  // Mouvements d'entrée (réceptions fournisseur, autonomes)
  const mouvementsData = Array.from({ length: 25 }, () => {
    const article = faker.helpers.arrayElement(articlesData)
    return {
      id: id(),
      articleId: article.id,
      type: 'entree' as const,
      quantite: faker.number.int({ min: 1, max: 30 }),
      fournisseurId: faker.helpers.arrayElement(fournisseursData).id,
      sortieId: null,
      bonLivraison: `BL-${faker.string.alphanumeric(6).toUpperCase()}`,
      motif: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }) ?? null,
      createdAt: faker.date.recent({ days: 60 }).toISOString().replace('T', ' ').slice(0, 19),
    }
  })

  // Bons de sortie (entête + lignes + mouvements de sortie rattachés)
  const sortiesData: (typeof schema.sorties.$inferInsert)[] = []
  const lignesSortieData: (typeof schema.lignesSortie.$inferInsert)[] = []

  for (let i = 0; i < 12; i++) {
    const sortieId = id()
    const date = faker.date.recent({ days: 60 })
    const dateIso = date.toISOString().slice(0, 10)
    const articlesSortie = faker.helpers.arrayElements(articlesData, { min: 1, max: 4 })

    let montantTotal = 0
    for (const article of articlesSortie) {
      const quantite = faker.number.int({ min: 1, max: 15 })
      const prixUnitaire = article.prixUnitaire ?? 0
      montantTotal += quantite * prixUnitaire
      lignesSortieData.push({
        id: id(),
        sortieId,
        articleId: article.id,
        quantite,
        prixUnitaire,
        stockApres: article.stockActuel,
      })
      mouvementsData.push({
        id: id(),
        articleId: article.id,
        type: 'sortie',
        quantite,
        fournisseurId: null,
        sortieId,
        bonLivraison: null,
        motif: `Bon de sortie`,
        createdAt: date.toISOString().replace('T', ' ').slice(0, 19),
      })
    }

    const statutPaiement = faker.helpers.arrayElement([
      'paye',
      'paye',
      'partiel',
      'impaye',
    ] as const)
    const montantPaye =
      statutPaiement === 'paye'
        ? montantTotal
        : statutPaiement === 'impaye'
          ? 0
          : Math.round(montantTotal * 0.5)

    sortiesData.push({
      id: sortieId,
      reference: `BS-${dateIso.replace(/-/g, '')}-${faker.string.alphanumeric(4).toUpperCase()}`,
      clientId: faker.helpers.arrayElement(clientsData).id,
      dateSortie: dateIso,
      objet:
        faker.helpers.maybe(() => `Livraison ${faker.commerce.department()}`, {
          probability: 0.5,
        }) ?? null,
      montantTotal,
      modeReglement: faker.helpers.arrayElement(['comptant', 'credit', 'mobile_money'] as const),
      statutPaiement,
      montantPaye,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }) ?? null,
    })
  }

  await db.insert(schema.sorties).values(sortiesData)
  await db.insert(schema.lignesSortie).values(lignesSortieData)
  await db.insert(schema.mouvements).values(mouvementsData)
  console.log(
    `  ${sortiesData.length} bons de sortie, ${lignesSortieData.length} lignes, ${mouvementsData.length} mouvements créés`,
  )

  console.log('Seed terminé !')
}

seed().catch(console.error)
