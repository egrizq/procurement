ALTER TABLE `moc_vendors` RENAME COLUMN `lead_time` TO `available_qty`;--> statement-breakpoint
ALTER TABLE `moc_vendors` MODIFY COLUMN `available_qty` int NOT NULL;--> statement-breakpoint
ALTER TABLE `moc_vendors` MODIFY COLUMN `available_qty` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD `warranty` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD `discount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD `saw_score` decimal(10,4);