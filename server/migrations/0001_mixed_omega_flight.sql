CREATE TABLE `parametres` (
	`id` text PRIMARY KEY NOT NULL,
	`utilisateur_prenom` text,
	`utilisateur_nom` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
