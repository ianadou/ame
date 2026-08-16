CREATE TABLE `chantiers` (
	`id` text PRIMARY KEY NOT NULL,
	`nom` text NOT NULL,
	`ville` text,
	`adresse` text,
	`statut` text NOT NULL DEFAULT 'en_cours',
	`client_id` text,
	`budget_alloue` real,
	`date_debut` text,
	`date_fin_prevue` text,
	`notes` text,
	`created_at` text NOT NULL DEFAULT (datetime('now')),
	`updated_at` text NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
	CONSTRAINT `chantiers_statut_valide` CHECK(`statut` IN ('en_cours','termine','pause')),
	CONSTRAINT `chantiers_budget_positif` CHECK(`budget_alloue` IS NULL OR `budget_alloue` >= 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX `chantiers_nom_unique` ON `chantiers` (`nom`);--> statement-breakpoint
CREATE TABLE `beneficiaires` (
	`id` text PRIMARY KEY NOT NULL,
	`nom` text NOT NULL,
	`fonction` text,
	`telephone` text,
	`actif` integer NOT NULL DEFAULT 1,
	`created_at` text NOT NULL DEFAULT (datetime('now')),
	CONSTRAINT `beneficiaires_actif_bool` CHECK(`actif` IN (0,1))
);--> statement-breakpoint
CREATE UNIQUE INDEX `beneficiaires_nom_unique` ON `beneficiaires` (`nom`);
