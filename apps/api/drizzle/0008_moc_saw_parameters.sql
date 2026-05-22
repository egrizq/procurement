ALTER TABLE `moc_vendors` ADD COLUMN `available_qty` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD COLUMN `warranty` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD COLUMN `discount` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD COLUMN `saw_score` decimal(10,4);--> statement-breakpoint
ALTER TABLE `moc_vendors` DROP COLUMN `lead_time`;
