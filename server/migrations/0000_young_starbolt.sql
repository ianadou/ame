CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`nom` text NOT NULL,
	`categorie_id` text,
	`unite` text DEFAULT 'pièce' NOT NULL,
	`prix_unitaire` real,
	`stock_actuel` integer DEFAULT 0 NOT NULL,
	`seuil_alerte` integer DEFAULT 5 NOT NULL,
	`emplacement` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`categorie_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_reference_unique` ON `articles` (`reference`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`nom` text NOT NULL,
	`description` text,
	`parent_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `chantiers` (
	`id` text PRIMARY KEY NOT NULL,
	`nom` text NOT NULL,
	`adresse` text,
	`statut` text DEFAULT 'en_cours' NOT NULL,
	`date_debut` text,
	`date_fin` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `commandes` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`fournisseur_id` text NOT NULL,
	`statut` text DEFAULT 'brouillon' NOT NULL,
	`date_commande` text,
	`date_livraison_prevue` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commandes_reference_unique` ON `commandes` (`reference`);--> statement-breakpoint
CREATE TABLE `fournisseurs` (
	`id` text PRIMARY KEY NOT NULL,
	`nom` text NOT NULL,
	`contact` text,
	`telephone` text,
	`email` text,
	`adresse` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lignes_commande` (
	`id` text PRIMARY KEY NOT NULL,
	`commande_id` text NOT NULL,
	`article_id` text NOT NULL,
	`quantite` integer NOT NULL,
	`quantite_recue` integer DEFAULT 0 NOT NULL,
	`prix_unitaire` real,
	FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `mouvements` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`type` text NOT NULL,
	`quantite` integer NOT NULL,
	`fournisseur_id` text,
	`chantier_id` text,
	`bon_livraison` text,
	`motif` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`chantier_id`) REFERENCES `chantiers`(`id`) ON UPDATE no action ON DELETE set null
);
