ALTER TABLE `articles` ADD COLUMN `type` text NOT NULL DEFAULT 'consommable' CHECK(`type` IN ('consommable','equipement'));--> statement-breakpoint
ALTER TABLE `articles` ADD COLUMN `retournable` integer NOT NULL DEFAULT 0 CHECK(`retournable` IN (0,1));
