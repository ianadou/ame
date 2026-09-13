-- Un bon émis sous TVA doit son montant TTC. Jusqu'ici « Payé » y enregistrait
-- le seul montant HT, repris tel quel en règlement par la migration 0014. Ces
-- bons ont été déclarés soldés : on complète leur règlement de la TVA pour
-- qu'ils le restent, au lieu de réapparaître en créance du montant de la TVA.
INSERT INTO `reglements` (`id`, `sortie_id`, `montant`, `date_reglement`, `mode`, `reference`, `notes`)
SELECT
	lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
	`s`.`id`,
	round(`s`.`montant_total` * (1 + `s`.`taux_tva_applique` / 100.0) - `s`.`montant_paye`, 2),
	coalesce(
		(SELECT max(`r`.`date_reglement`) FROM `reglements` `r` WHERE `r`.`sortie_id` = `s`.`id`),
		`s`.`date_sortie`,
		date(`s`.`created_at`)
	),
	coalesce(
		(SELECT `r`.`mode` FROM `reglements` `r` WHERE `r`.`sortie_id` = `s`.`id` ORDER BY `r`.`date_reglement` DESC, `r`.`created_at` DESC LIMIT 1),
		'especes'
	),
	NULL,
	'Report de l''historique : TVA comprise dans le paiement déclaré « Payé »'
FROM `sorties` `s`
WHERE `s`.`statut` = 'actif'
	AND `s`.`statut_paiement` = 'paye'
	AND `s`.`taux_tva_applique` > 0
	AND `s`.`montant_total` * (1 + `s`.`taux_tva_applique` / 100.0) - `s`.`montant_paye` > 0.5;--> statement-breakpoint
UPDATE `sorties`
SET `montant_paye` = (SELECT sum(`r`.`montant`) FROM `reglements` `r` WHERE `r`.`sortie_id` = `sorties`.`id`)
WHERE `statut` = 'actif'
	AND `statut_paiement` = 'paye'
	AND `taux_tva_applique` > 0
	AND EXISTS (SELECT 1 FROM `reglements` `r` WHERE `r`.`sortie_id` = `sorties`.`id`);
