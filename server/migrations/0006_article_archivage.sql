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
	`statut` text DEFAULT 'actif' NOT NULL,
	`archive_le` text,
	`motif_archivage` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`categorie_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT `articles_prix_positif` CHECK(`prix_unitaire` IS NULL OR `prix_unitaire` > 0),
	CONSTRAINT `articles_stock_positif` CHECK(`stock_actuel` >= 0),
	CONSTRAINT `articles_seuil_positif` CHECK(`seuil_alerte` >= 0),
	CONSTRAINT `articles_statut_valide` CHECK(`statut` IN ('actif','archive')),
	CONSTRAINT `articles_archivage_coherent` CHECK(
		(`statut` = 'actif' AND `archive_le` IS NULL AND `motif_archivage` IS NULL)
		OR (`statut` = 'archive' AND `archive_le` IS NOT NULL AND `motif_archivage` IS NOT NULL)
	)
);--> statement-breakpoint
INSERT INTO `__new_articles` (`id`, `reference`, `nom`, `categorie_id`, `unite`, `prix_unitaire`, `stock_actuel`, `seuil_alerte`, `emplacement`, `notes`, `statut`, `archive_le`, `motif_archivage`, `created_at`, `updated_at`) SELECT `id`, `reference`, `nom`, `categorie_id`, `unite`, `prix_unitaire`, `stock_actuel`, `seuil_alerte`, `emplacement`, `notes`, 'actif', NULL, NULL, `created_at`, `updated_at` FROM `articles`;--> statement-breakpoint
DROP TABLE `articles`;--> statement-breakpoint
ALTER TABLE `__new_articles` RENAME TO `articles`;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_reference_unique` ON `articles` (`reference`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
