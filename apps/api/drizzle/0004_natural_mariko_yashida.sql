CREATE TABLE `role_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_type` enum('Admin','Staff','Manager','Crew') NOT NULL,
	`module_slug` varchar(100) NOT NULL,
	CONSTRAINT `role_modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_modules_type_slug_unique` UNIQUE(`user_type`,`module_slug`)
);
--> statement-breakpoint
ALTER TABLE `vessel_item_standard` MODIFY COLUMN `periode` enum('weekly','monthly','quarterly','yearly','occasional') NOT NULL;