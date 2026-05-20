CREATE TABLE `moc_vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moc_id` int NOT NULL,
	`vendor_id` int NOT NULL,
	`unit_price` int NOT NULL,
	`lead_time` varchar(100) NOT NULL,
	`remarks` text,
	`is_selected` boolean NOT NULL DEFAULT false,
	CONSTRAINT `moc_vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mocs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vessel_request_id` int NOT NULL,
	`vessel_request_item_id` int NOT NULL,
	`status` enum('Draft','Completed') NOT NULL DEFAULT 'Draft',
	`created_by` int NOT NULL,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mocs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vessel_item_standard` MODIFY COLUMN `periode` enum('weekly','monthly','quarterly') NOT NULL;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD CONSTRAINT `moc_vendors_moc_id_mocs_id_fk` FOREIGN KEY (`moc_id`) REFERENCES `mocs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD CONSTRAINT `moc_vendors_vendor_id_mst_vendors_id_fk` FOREIGN KEY (`vendor_id`) REFERENCES `mst_vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mocs` ADD CONSTRAINT `mocs_vessel_request_id_vessel_requests_id_fk` FOREIGN KEY (`vessel_request_id`) REFERENCES `vessel_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mocs` ADD CONSTRAINT `mocs_vessel_request_item_id_vessel_request_items_id_fk` FOREIGN KEY (`vessel_request_item_id`) REFERENCES `vessel_request_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mocs` ADD CONSTRAINT `mocs_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;