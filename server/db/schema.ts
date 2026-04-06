import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
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

export const articles = sqliteTable('articles', {
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
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

export const fournisseurs = sqliteTable('fournisseurs', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  contact: text('contact'),
  telephone: text('telephone'),
  email: text('email'),
  adresse: text('adresse'),
  notes: text('notes'),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

export const chantiers = sqliteTable('chantiers', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  adresse: text('adresse'),
  statut: text('statut').notNull().default('en_cours'),
  dateDebut: text('date_debut'),
  dateFin: text('date_fin'),
  notes: text('notes'),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

export const mouvements = sqliteTable('mouvements', {
  id: text('id').primaryKey(),
  articleId: text('article_id')
    .references(() => articles.id, { onDelete: 'restrict' })
    .notNull(),
  type: text('type').notNull(),
  quantite: integer('quantite').notNull(),
  fournisseurId: text('fournisseur_id').references(() => fournisseurs.id, {
    onDelete: 'set null',
  }),
  chantierId: text('chantier_id').references(() => chantiers.id, { onDelete: 'set null' }),
  bonLivraison: text('bon_livraison'),
  motif: text('motif'),
  createdAt: text('created_at')
    .default(sql`(datetime('now'))`)
    .notNull(),
})

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

export const lignesCommande = sqliteTable('lignes_commande', {
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
})
