PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	`statut` text DEFAULT 'actif' NOT NULL,
	`annule_le` text,
	`motif_annulation` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `sorties_montant_total_positif` CHECK(`montant_total` >= 0),
	CONSTRAINT `sorties_montant_paye_positif` CHECK(`montant_paye` >= 0),
	CONSTRAINT `sorties_statut_valide` CHECK(`statut` IN ('actif','annule')),
	CONSTRAINT `sorties_annulation_coherente` CHECK(
		(`statut` = 'actif' AND `annule_le` IS NULL AND `motif_annulation` IS NULL)
		OR (`statut` = 'annule' AND `annule_le` IS NOT NULL AND `motif_annulation` IS NOT NULL)
	)
);--> statement-breakpoint
INSERT INTO `__new_sorties` (`id`, `reference`, `client_id`, `date_sortie`, `objet`, `montant_total`, `mode_reglement`, `statut_paiement`, `montant_paye`, `notes`, `statut`, `annule_le`, `motif_annulation`, `created_at`) SELECT `id`, `reference`, `client_id`, `date_sortie`, `objet`, `montant_total`, `mode_reglement`, `statut_paiement`, `montant_paye`, `notes`, 'actif', NULL, NULL, `created_at` FROM `sorties`;--> statement-breakpoint
DROP TABLE `sorties`;--> statement-breakpoint
ALTER TABLE `__new_sorties` RENAME TO `sorties`;--> statement-breakpoint
CREATE UNIQUE INDEX `sorties_reference_unique` ON `sorties` (`reference`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
