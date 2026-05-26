ALTER TABLE `parametres` ADD COLUMN `regime_tva` text NOT NULL DEFAULT 'non_assujetti' CHECK(`regime_tva` IN ('assujetti','non_assujetti'));--> statement-breakpoint
ALTER TABLE `parametres` ADD COLUMN `taux_tva` real NOT NULL DEFAULT 18 CHECK(`taux_tva` >= 0 AND `taux_tva` <= 30);--> statement-breakpoint
ALTER TABLE `sorties` ADD COLUMN `taux_tva_applique` real CHECK(`taux_tva_applique` IS NULL OR (`taux_tva_applique` >= 0 AND `taux_tva_applique` <= 30));--> statement-breakpoint
ALTER TABLE `commandes` ADD COLUMN `taux_tva_applique` real CHECK(`taux_tva_applique` IS NULL OR (`taux_tva_applique` >= 0 AND `taux_tva_applique` <= 30));
