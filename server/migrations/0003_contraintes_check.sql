PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_articles` (
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
	FOREIGN KEY (`categorie_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT `articles_prix_positif` CHECK(`prix_unitaire` IS NULL OR `prix_unitaire` > 0),
	CONSTRAINT `articles_stock_positif` CHECK(`stock_actuel` >= 0),
	CONSTRAINT `articles_seuil_positif` CHECK(`seuil_alerte` >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_articles` (`id`, `reference`, `nom`, `categorie_id`, `unite`, `prix_unitaire`, `stock_actuel`, `seuil_alerte`, `emplacement`, `notes`, `created_at`, `updated_at`) SELECT `id`, `reference`, `nom`, `categorie_id`, `unite`, `prix_unitaire`, `stock_actuel`, `seuil_alerte`, `emplacement`, `notes`, `created_at`, `updated_at` FROM `articles`;--> statement-breakpoint
DROP TABLE `articles`;--> statement-breakpoint
ALTER TABLE `__new_articles` RENAME TO `articles`;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_reference_unique` ON `articles` (`reference`);--> statement-breakpoint
CREATE TABLE `__new_mouvements` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`type` text NOT NULL,
	`quantite` integer NOT NULL,
	`fournisseur_id` text,
	`sortie_id` text,
	`bon_livraison` text,
	`motif` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`sortie_id`) REFERENCES `sorties`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT `mouvements_quantite_positive` CHECK(`quantite` > 0)
);
--> statement-breakpoint
INSERT INTO `__new_mouvements` (`id`, `article_id`, `type`, `quantite`, `fournisseur_id`, `sortie_id`, `bon_livraison`, `motif`, `created_at`) SELECT `id`, `article_id`, `type`, `quantite`, `fournisseur_id`, `sortie_id`, `bon_livraison`, `motif`, `created_at` FROM `mouvements`;--> statement-breakpoint
DROP TABLE `mouvements`;--> statement-breakpoint
ALTER TABLE `__new_mouvements` RENAME TO `mouvements`;--> statement-breakpoint
CREATE TABLE `__new_lignes_sortie` (
	`id` text PRIMARY KEY NOT NULL,
	`sortie_id` text NOT NULL,
	`article_id` text NOT NULL,
	`quantite` integer NOT NULL,
	`prix_unitaire` real DEFAULT 0 NOT NULL,
	`stock_apres` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`sortie_id`) REFERENCES `sorties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `lignes_sortie_quantite_positive` CHECK(`quantite` > 0),
	CONSTRAINT `lignes_sortie_prix_positif` CHECK(`prix_unitaire` >= 0),
	CONSTRAINT `lignes_sortie_stock_positif` CHECK(`stock_apres` >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_lignes_sortie` (`id`, `sortie_id`, `article_id`, `quantite`, `prix_unitaire`, `stock_apres`) SELECT `id`, `sortie_id`, `article_id`, `quantite`, `prix_unitaire`, `stock_apres` FROM `lignes_sortie`;--> statement-breakpoint
DROP TABLE `lignes_sortie`;--> statement-breakpoint
ALTER TABLE `__new_lignes_sortie` RENAME TO `lignes_sortie`;--> statement-breakpoint
CREATE TABLE `__new_sorties` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`client_id` text NOT NULL,
	`date_sortie` text,
	`objet` text,
	`montant_total` real DEFAULT 0 NOT NULL,
	`mode_reglement` text DEFAULT 'comptant' NOT NULL,
	`statut_paiement` text DEFAULT 'paye' NOT NULL,
	`montant_paye` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `sorties_montant_total_positif` CHECK(`montant_total` >= 0),
	CONSTRAINT `sorties_montant_paye_positif` CHECK(`montant_paye` >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_sorties` (`id`, `reference`, `client_id`, `date_sortie`, `objet`, `montant_total`, `mode_reglement`, `statut_paiement`, `montant_paye`, `notes`, `created_at`) SELECT `id`, `reference`, `client_id`, `date_sortie`, `objet`, `montant_total`, `mode_reglement`, `statut_paiement`, `montant_paye`, `notes`, `created_at` FROM `sorties`;--> statement-breakpoint
DROP TABLE `sorties`;--> statement-breakpoint
ALTER TABLE `__new_sorties` RENAME TO `sorties`;--> statement-breakpoint
CREATE UNIQUE INDEX `sorties_reference_unique` ON `sorties` (`reference`);--> statement-breakpoint
CREATE TABLE `__new_lignes_commande` (
	`id` text PRIMARY KEY NOT NULL,
	`commande_id` text NOT NULL,
	`article_id` text NOT NULL,
	`quantite` integer NOT NULL,
	`quantite_recue` integer DEFAULT 0 NOT NULL,
	`prix_unitaire` real,
	FOREIGN KEY (`commande_id`) REFERENCES `commandes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `lignes_commande_quantite_positive` CHECK(`quantite` > 0),
	CONSTRAINT `lignes_commande_recue_positive` CHECK(`quantite_recue` >= 0),
	CONSTRAINT `lignes_commande_prix_positif` CHECK(`prix_unitaire` IS NULL OR `prix_unitaire` > 0)
);
--> statement-breakpoint
INSERT INTO `__new_lignes_commande` (`id`, `commande_id`, `article_id`, `quantite`, `quantite_recue`, `prix_unitaire`) SELECT `id`, `commande_id`, `article_id`, `quantite`, `quantite_recue`, `prix_unitaire` FROM `lignes_commande`;--> statement-breakpoint
DROP TABLE `lignes_commande`;--> statement-breakpoint
ALTER TABLE `__new_lignes_commande` RENAME TO `lignes_commande`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
