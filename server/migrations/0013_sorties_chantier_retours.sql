ALTER TABLE `sorties` ADD COLUMN `chantier_id` text REFERENCES `chantiers`(`id`);--> statement-breakpoint
ALTER TABLE `sorties` ADD COLUMN `beneficiaire_id` text REFERENCES `beneficiaires`(`id`);--> statement-breakpoint
CREATE TABLE `retours` (
	`id` text PRIMARY KEY NOT NULL,
	`ligne_sortie_id` text NOT NULL,
	`quantite` integer NOT NULL,
	`date_retour` text NOT NULL,
	`etat` text NOT NULL DEFAULT 'bon',
	`notes` text,
	`created_at` text NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (`ligne_sortie_id`) REFERENCES `lignes_sortie`(`id`) ON DELETE CASCADE,
	CONSTRAINT `retours_quantite_positive` CHECK(`quantite` > 0),
	CONSTRAINT `retours_etat_valide` CHECK(`etat` IN ('bon','endommage'))
);--> statement-breakpoint
CREATE INDEX `retours_ligne_sortie_idx` ON `retours` (`ligne_sortie_id`);
