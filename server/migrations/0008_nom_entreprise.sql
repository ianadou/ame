ALTER TABLE `parametres` ADD COLUMN `nom_entreprise` text;--> statement-breakpoint
UPDATE `parametres` SET `nom_entreprise` = NULLIF(TRIM(COALESCE(`utilisateur_prenom`,'') || ' ' || COALESCE(`utilisateur_nom`,'')), '');--> statement-breakpoint
ALTER TABLE `parametres` DROP COLUMN `utilisateur_prenom`;--> statement-breakpoint
ALTER TABLE `parametres` DROP COLUMN `utilisateur_nom`;
