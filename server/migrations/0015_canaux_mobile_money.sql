CREATE TABLE `reglements_nouveau` (
	`id` text PRIMARY KEY NOT NULL,
	`sortie_id` text NOT NULL,
	`montant` real NOT NULL,
	`date_reglement` text NOT NULL,
	`mode` text NOT NULL DEFAULT 'especes',
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (`sortie_id`) REFERENCES `sorties`(`id`) ON DELETE CASCADE,
	CONSTRAINT `reglements_montant_positif` CHECK(`montant` > 0),
	CONSTRAINT `reglements_mode_valide` CHECK(`mode` IN ('orange_money','mtn_momo','moov_money','wave','especes','virement','cheque','mobile_money'))
);--> statement-breakpoint
INSERT INTO `reglements_nouveau` (`id`, `sortie_id`, `montant`, `date_reglement`, `mode`, `reference`, `notes`, `created_at`)
SELECT `id`, `sortie_id`, `montant`, `date_reglement`, `mode`, NULL, `notes`, `created_at` FROM `reglements`;--> statement-breakpoint
DROP TABLE `reglements`;--> statement-breakpoint
ALTER TABLE `reglements_nouveau` RENAME TO `reglements`;--> statement-breakpoint
CREATE INDEX `reglements_sortie_idx` ON `reglements` (`sortie_id`);--> statement-breakpoint
ALTER TABLE `sorties` RENAME COLUMN `mode_reglement` TO `conditions_reglement`;--> statement-breakpoint
UPDATE `sorties` SET `conditions_reglement` = 'comptant' WHERE `conditions_reglement` = 'mobile_money';
