CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`nom` text NOT NULL,
	`type` text DEFAULT 'entreprise' NOT NULL,
	`contact` text,
	`telephone` text,
	`email` text,
	`adresse` text,
	`ville` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sorties` (
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
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sorties_reference_unique` ON `sorties` (`reference`);--> statement-breakpoint
CREATE TABLE `lignes_sortie` (
	`id` text PRIMARY KEY NOT NULL,
	`sortie_id` text NOT NULL,
	`article_id` text NOT NULL,
	`quantite` integer NOT NULL,
	`prix_unitaire` real DEFAULT 0 NOT NULL,
	`stock_apres` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`sortie_id`) REFERENCES `sorties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
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
	FOREIGN KEY (`sortie_id`) REFERENCES `sorties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_mouvements` (`id`, `article_id`, `type`, `quantite`, `fournisseur_id`, `sortie_id`, `bon_livraison`, `motif`, `created_at`) SELECT `id`, `article_id`, `type`, `quantite`, `fournisseur_id`, NULL, `bon_livraison`, `motif`, `created_at` FROM `mouvements`;--> statement-breakpoint
DROP TABLE `mouvements`;--> statement-breakpoint
ALTER TABLE `__new_mouvements` RENAME TO `mouvements`;--> statement-breakpoint
DROP TABLE `chantiers`;
