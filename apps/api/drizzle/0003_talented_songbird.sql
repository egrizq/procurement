DROP TABLE `po_settings`;--> statement-breakpoint
ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_vessel_request_item_id_vessel_request_items_id_fk`;
--> statement-breakpoint
ALTER TABLE `vessel_item_standard` ADD `po_threshold` decimal(15,2);--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD CONSTRAINT `po_vr_item_fk` FOREIGN KEY (`vessel_request_item_id`) REFERENCES `vessel_request_items`(`id`) ON DELETE no action ON UPDATE no action;