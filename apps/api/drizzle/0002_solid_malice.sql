ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_vr_item_id_vr_items_id_fk`;
--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_vessel_request_item_id_vessel_request_items_id_fk` FOREIGN KEY (`vessel_request_item_id`) REFERENCES `vessel_request_items`(`id`) ON DELETE no action ON UPDATE no action;