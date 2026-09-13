-- Retours et annulations étaient journalisés en 'entree', comme un
-- approvisionnement fournisseur. Une entrée liée à un bon annulé vient de son
-- annulation, une entrée liée à un bon actif vient d'un retour : les deux cas
-- s'excluent, un bon avec des retours ne pouvant plus être annulé.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	CONSTRAINT `mouvements_quantite_positive` CHECK(`quantite` > 0),
	CONSTRAINT `mouvements_type_valide` CHECK(`type` IN ('entree','sortie','retour','annulation','ajustement_positif','ajustement_negatif'))
);--> statement-breakpoint
INSERT INTO `__new_mouvements` (`id`, `article_id`, `type`, `quantite`, `fournisseur_id`, `sortie_id`, `bon_livraison`, `motif`, `created_at`)
SELECT `m`.`id`, `m`.`article_id`,
	CASE
		WHEN `m`.`type` = 'entree' AND `s`.`statut` = 'annule' THEN 'annulation'
		WHEN `m`.`type` = 'entree' AND `s`.`id` IS NOT NULL THEN 'retour'
		ELSE `m`.`type`
	END,
	`m`.`quantite`, `m`.`fournisseur_id`, `m`.`sortie_id`, `m`.`bon_livraison`, `m`.`motif`, `m`.`created_at`
FROM `mouvements` `m` LEFT JOIN `sorties` `s` ON `s`.`id` = `m`.`sortie_id`;--> statement-breakpoint
DROP TABLE `mouvements`;--> statement-breakpoint
ALTER TABLE `__new_mouvements` RENAME TO `mouvements`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
