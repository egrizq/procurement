CREATE TABLE `vessel_item_standard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vessel_id` int NOT NULL,
	`item_id` int NOT NULL,
	`periode` enum('weekly','monthly','quarterly') NOT NULL,
	`min_stock` int NOT NULL,
	`max_stock` int NOT NULL,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vessel_item_standard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_vessel_id` ON `vessel_item_standard` (`vessel_id`);--> statement-breakpoint
CREATE INDEX `idx_item_id` ON `vessel_item_standard` (`item_id`);