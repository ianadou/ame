ALTER TABLE `sorties` ADD COLUMN `date_echeance` text;--> statement-breakpoint
CREATE TABLE `reglements` (
	`id` text PRIMARY KEY NOT NULL,
	`sortie_id` text NOT NULL,
	`montant` real NOT NULL,
	`date_reglement` text NOT NULL,
	`mode` text NOT NULL DEFAULT 'especes',
	`notes` text,
	`created_at` text NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (`sortie_id`) REFERENCES `sorties`(`id`) ON DELETE CASCADE,
	CONSTRAINT `reglements_montant_positif` CHECK(`montant` > 0),
	CONSTRAINT `reglements_mode_valide` CHECK(`mode` IN ('especes','mobile_money','virement','cheque'))
);--> statement-breakpoint
CREATE INDEX `reglements_sortie_idx` ON `reglements` (`sortie_id`);--> statement-breakpoint
INSERT INTO `reglements` (`id`, `sortie_id`, `montant`, `date_reglement`, `mode`, `notes`)
SELECT
	lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
	`id`,
	`montant_paye`,
	coalesce(`date_sortie`, date(`created_at`)),
	CASE `mode_reglement` WHEN 'mobile_money' THEN 'mobile_money' ELSE 'especes' END,
	'Report de l''historique : montant déjà encaissé avant le suivi des règlements'
FROM `sorties`
WHERE `montant_paye` > 0;
