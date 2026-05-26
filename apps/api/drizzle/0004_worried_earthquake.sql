CREATE TABLE `good_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gr_number` varchar(50) NOT NULL,
	`purchase_order_id` int NOT NULL,
	`is_same_item` boolean NOT NULL,
	`status` enum('Accepted','Rejected') NOT NULL,
	`discrepancy_reason` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `good_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `good_receipts_gr_number_unique` UNIQUE(`gr_number`)
);
--> statement-breakpoint
ALTER TABLE `good_receipts` ADD CONSTRAINT `good_receipts_purchase_order_id_purchase_orders_id_fk` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `good_receipts` ADD CONSTRAINT `good_receipts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_gr_po_id` ON `good_receipts` (`purchase_order_id`);--> statement-breakpoint
CREATE INDEX `idx_gr_status` ON `good_receipts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_gr_created_by` ON `good_receipts` (`created_by`);