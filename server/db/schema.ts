import { sqliteTable, text, integer, real, check } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  description: text('description'),
  parentId: text('parent_id').references(() => categories.id, { onDelete: 'set null' }),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

export const articles = sqliteTable(
  'articles',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull().unique(),
    nom: text('nom').notNull(),
    categorieId: text('categorie_id').references(() => categories.id, { onDelete: 'set null' }),
    unite: text('unite').notNull().default('pièce'),
    prixUnitaire: real('prix_unitaire'),
    stockActuel: integer('stock_actuel').notNull().default(0),
    seuilAlerte: integer('seuil_alerte').notNull().default(5),
    emplacement: text('emplacement'),
    notes: text('notes'),
    statut: text('statut').notNull().default('actif'),
    archiveLe: text('archive_le'),
    motifArchivage: text('motif_archivage'),
    createdAt: text('created_at')
      .default(sql`(datetime('now'))`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (t) => [
    check('articles_prix_positif', sql`${t.prixUnitaire} IS NULL OR ${t.prixUnitaire} > 0`),
    check('articles_stock_positif', sql`${t.stockActuel} >= 0`),
    check('articles_seuil_positif', sql`${t.seuilAlerte} >= 0`),
    check('articles_statut_valide', sql`${t.statut} IN ('actif','archive')`),
    check(
      'articles_archivage_coherent',
      sql`(${t.statut} = 'actif' AND ${t.archiveLe} IS NULL AND ${t.motifArchivage} IS NULL) OR (${t.statut} = 'archive' AND ${t.archiveLe} IS NOT NULL AND ${t.motifArchivage} IS NOT NULL)`,
    ),
  ],
)

export const fournisseurs = sqliteTable('fournisseurs', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  telephone: text('telephone'),
  email: text('email'),
  adresse: text('adresse'),
  notes: text('notes'),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  type: text('type').notNull().default('entreprise'),
  telephone: text('telephone'),
  email: text('email'),
  adresse: text('adresse'),
  ville: text('ville'),
  notes: text('notes'),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

export const sorties = sqliteTable(
  'sorties',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull().unique(),
    clientId: text('client_id')
      .references(() => clients.id, { onDelete: 'restrict' })
      .notNull(),
    dateSortie: text('date_sortie'),
    objet: text('objet'),
    montantTotal: real('montant_total').notNull().default(0),
    modeReglement: text('mode_reglement').notNull().default('comptant'),
    statutPaiement: text('statut_paiement').notNull().default('paye'),
    montantPaye: real('montant_paye').notNull().default(0),
    notes: text('notes'),
    statut: text('statut').notNull().default('actif'),
    annuleLe: text('annule_le'),
    motifAnnulation: text('motif_annulation'),
    createdAt: text('created_at')
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (t) => [
    check('sorties_montant_total_positif', sql`${t.montantTotal} >= 0`),
    check('sorties_montant_paye_positif', sql`${t.montantPaye} >= 0`),
    check('sorties_statut_valide', sql`${t.statut} IN ('actif','annule')`),
    check(
      'sorties_annulation_coherente',
      sql`(${t.statut} = 'actif' AND ${t.annuleLe} IS NULL AND ${t.motifAnnulation} IS NULL) OR (${t.statut} = 'annule' AND ${t.annuleLe} IS NOT NULL AND ${t.motifAnnulation} IS NOT NULL)`,
    ),
  ],
)

export const lignesSortie = sqliteTable(
  'lignes_sortie',
  {
    id: text('id').primaryKey(),
    sortieId: text('sortie_id')
      .references(() => sorties.id, { onDelete: 'cascade' })
      .notNull(),
    articleId: text('article_id')
      .references(() => articles.id, { onDelete: 'restrict' })
      .notNull(),
    quantite: integer('quantite').notNull(),
    prixUnitaire: real('prix_unitaire').notNull().default(0),
    stockApres: integer('stock_apres').notNull().default(0),
  },
  (t) => [
    check('lignes_sortie_quantite_positive', sql`${t.quantite} > 0`),
    check('lignes_sortie_prix_positif', sql`${t.prixUnitaire} >= 0`),
    check('lignes_sortie_stock_positif', sql`${t.stockApres} >= 0`),
  ],
)

export const mouvements = sqliteTable(
  'mouvements',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .references(() => articles.id, { onDelete: 'restrict' })
      .notNull(),
    type: text('type').notNull(),
    quantite: integer('quantite').notNull(),
    fournisseurId: text('fournisseur_id').references(() => fournisseurs.id, {
      onDelete: 'set null',
    }),
    sortieId: text('sortie_id').references(() => sorties.id, { onDelete: 'set null' }),
    bonLivraison: text('bon_livraison'),
    motif: text('motif'),
    createdAt: text('created_at')
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (t) => [
    check('mouvements_quantite_positive', sql`${t.quantite} > 0`),
    check(
      'mouvements_type_valide',
      sql`${t.type} IN ('entree','sortie','ajustement_positif','ajustement_negatif')`,
    ),
  ],
)

export const commandes = sqliteTable('commandes', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull().unique(),
  fournisseurId: text('fournisseur_id')
    .references(() => fournisseurs.id, { onDelete: 'restrict' })
    .notNull(),
  statut: text('statut').notNull().default('brouillon'),
  dateCommande: text('date_commande'),
  dateLivraisonPrevue: text('date_livraison_prevue'),
  notes: text('notes'),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

// Paramètres applicatifs mono-ligne (id fixe 'app') : nom de l'entreprise
// affiché dans le footer et la sidebar (Phase 1 mono-poste, cf. archi
// déploiement). Remplace l'ancien couple prénom/nom.
export const parametres = sqliteTable('parametres', {
  id: text('id').primaryKey(),
  nomEntreprise: text('nom_entreprise'),
  updatedAt: text('updated_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

export const lignesCommande = sqliteTable(
  'lignes_commande',
  {
    id: text('id').primaryKey(),
    commandeId: text('commande_id')
      .references(() => commandes.id, { onDelete: 'cascade' })
      .notNull(),
    articleId: text('article_id')
      .references(() => articles.id, { onDelete: 'restrict' })
      .notNull(),
    quantite: integer('quantite').notNull(),
    quantiteRecue: integer('quantite_recue').notNull().default(0),
    prixUnitaire: real('prix_unitaire'),
  },
  (t) => [
    check('lignes_commande_quantite_positive', sql`${t.quantite} > 0`),
    check('lignes_commande_recue_positive', sql`${t.quantiteRecue} >= 0`),
    check('lignes_commande_prix_positif', sql`${t.prixUnitaire} IS NULL OR ${t.prixUnitaire} > 0`),
  ],
)
