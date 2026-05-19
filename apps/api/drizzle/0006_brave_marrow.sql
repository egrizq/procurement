CREATE TABLE `mst_city` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city_name` varchar(255) NOT NULL,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	CONSTRAINT `mst_city_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vessel_requests` ADD `reject_reason` text;