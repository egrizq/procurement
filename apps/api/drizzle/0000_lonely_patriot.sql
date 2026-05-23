CREATE TABLE `api_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`device_id` varchar(255) NOT NULL,
	`device_name` varchar(255),
	`token` varchar(255) NOT NULL,
	`user_id` int,
	`expired_at` timestamp(0) NOT NULL,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `mst_vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('Jasa','Sparepart','Fuel','Engine') NOT NULL,
	`address` text,
	`phone` varchar(50),
	`email` varchar(100),
	`city` varchar(100),
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mst_vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mst_item_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('Publish','Unpublish') NOT NULL DEFAULT 'Publish',
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mst_item_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mst_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit` enum('Pcs','Box','Liter','Meter','Kg') NOT NULL,
	`category_id` int NOT NULL,
	`status` enum('Publish','Unpublish') NOT NULL,
	`description` text,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mst_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mst_vessels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imo_number` varchar(100),
	`name` varchar(255) NOT NULL,
	`flag` varchar(100),
	`type` varchar(100),
	`status` enum('Publish','Unpublish') NOT NULL DEFAULT 'Publish',
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`img_url` varchar(255),
	CONSTRAINT `mst_vessels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`email` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`full_name` varchar(255),
	`type` enum('Admin','Staff','Manager','Crew') NOT NULL,
	`department` enum('IT','HR','Finance','Deck','Engine') NOT NULL,
	`vessel_id` int NOT NULL,
	`position` varchar(100),
	`status` enum('Contract','Permanent','Intern','Leave') NOT NULL DEFAULT 'Contract',
	`leave_date` date,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`img_url` varchar(255),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vessel_stocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vessel_id` int NOT NULL,
	`item_id` int NOT NULL,
	`stock_on_hand` int NOT NULL,
	`last_update` date NOT NULL,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vessel_stocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vessel_request_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vessel_request_id` int NOT NULL,
	`item_id` int NOT NULL,
	`qty_requested` int NOT NULL,
	`qty_approved` int,
	`unit` enum('Pcs','Box','Liter','Meter','Kg') NOT NULL,
	`status` enum('Approved by system','Waiting','Approved','Rejected') NOT NULL DEFAULT 'Waiting',
	`priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
	`justification` text,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`staff_justification` text,
	CONSTRAINT `vessel_request_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vessel_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_code` varchar(100) NOT NULL,
	`requested_by` int NOT NULL,
	`vessel_id` int NOT NULL,
	`status` enum('Approved by system','Waiting','Approved','Rejected') NOT NULL DEFAULT 'Waiting',
	`priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
	`justification` text,
	`request_date` date NOT NULL,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(0) NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`reviewed_at` timestamp(0),
	`reviewed_by` int,
	`reject_reason` text,
	CONSTRAINT `vessel_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `role_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_type` enum('Admin','Staff','Manager','Crew') NOT NULL,
	`module_slug` varchar(100) NOT NULL,
	CONSTRAINT `role_modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_modules_type_slug_unique` UNIQUE(`user_type`,`module_slug`)
);
--> statement-breakpoint
CREATE TABLE `mst_city` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city_name` varchar(255) NOT NULL,
	`created_at` timestamp(0) NOT NULL DEFAULT (now()),
	CONSTRAINT `mst_city_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moc_vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moc_id` int NOT NULL,
	`vendor_id` int NOT NULL,
	`unit_price` int NOT NULL,
	`available_qty` int NOT NULL DEFAULT 0,
	`warranty` int NOT NULL DEFAULT 0,
	`discount` int NOT NULL DEFAULT 0,
	`saw_score` decimal(10,4),
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
ALTER TABLE `api_tokens` ADD CONSTRAINT `api_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mst_items` ADD CONSTRAINT `mst_items_category_id_mst_item_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `mst_item_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_vessel_id_mst_vessels_id_fk` FOREIGN KEY (`vessel_id`) REFERENCES `mst_vessels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_stocks` ADD CONSTRAINT `vessel_stocks_vessel_id_mst_vessels_id_fk` FOREIGN KEY (`vessel_id`) REFERENCES `mst_vessels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_stocks` ADD CONSTRAINT `vessel_stocks_item_id_mst_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `mst_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_request_items` ADD CONSTRAINT `vessel_request_items_vessel_request_id_vessel_requests_id_fk` FOREIGN KEY (`vessel_request_id`) REFERENCES `vessel_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_request_items` ADD CONSTRAINT `vessel_request_items_item_id_mst_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `mst_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_requests` ADD CONSTRAINT `vessel_requests_requested_by_users_id_fk` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_requests` ADD CONSTRAINT `vessel_requests_vessel_id_mst_vessels_id_fk` FOREIGN KEY (`vessel_id`) REFERENCES `mst_vessels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_requests` ADD CONSTRAINT `vessel_requests_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_item_standard` ADD CONSTRAINT `vessel_item_standard_vessel_id_mst_vessels_id_fk` FOREIGN KEY (`vessel_id`) REFERENCES `mst_vessels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vessel_item_standard` ADD CONSTRAINT `vessel_item_standard_item_id_mst_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `mst_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD CONSTRAINT `moc_vendors_moc_id_mocs_id_fk` FOREIGN KEY (`moc_id`) REFERENCES `mocs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moc_vendors` ADD CONSTRAINT `moc_vendors_vendor_id_mst_vendors_id_fk` FOREIGN KEY (`vendor_id`) REFERENCES `mst_vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mocs` ADD CONSTRAINT `mocs_vessel_request_id_vessel_requests_id_fk` FOREIGN KEY (`vessel_request_id`) REFERENCES `vessel_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mocs` ADD CONSTRAINT `mocs_vessel_request_item_id_vessel_request_items_id_fk` FOREIGN KEY (`vessel_request_item_id`) REFERENCES `vessel_request_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mocs` ADD CONSTRAINT `mocs_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_device_user` ON `api_tokens` (`device_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_item_code` ON `mst_items` (`item_code`);--> statement-breakpoint
CREATE INDEX `idx_category_id` ON `mst_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `mst_items` (`status`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `mst_vessels` (`status`);--> statement-breakpoint
CREATE INDEX `users_vessel_id_fkey` ON `users` (`vessel_id`);--> statement-breakpoint
CREATE INDEX `idx_vessel_id` ON `vessel_stocks` (`vessel_id`);--> statement-breakpoint
CREATE INDEX `idx_item_id` ON `vessel_stocks` (`item_id`);--> statement-breakpoint
CREATE INDEX `idx_vessel_request_id` ON `vessel_request_items` (`vessel_request_id`);--> statement-breakpoint
CREATE INDEX `idx_item_id` ON `vessel_request_items` (`item_id`);--> statement-breakpoint
CREATE INDEX `idx_vessel_id` ON `vessel_requests` (`vessel_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `vessel_requests` (`status`);--> statement-breakpoint
CREATE INDEX `vessel_requests_requested_by_fkey` ON `vessel_requests` (`requested_by`);--> statement-breakpoint
CREATE INDEX `vessel_requests_reviewed_by_fkey` ON `vessel_requests` (`reviewed_by`);--> statement-breakpoint
CREATE INDEX `idx_vessel_id` ON `vessel_item_standard` (`vessel_id`);--> statement-breakpoint
CREATE INDEX `idx_item_id` ON `vessel_item_standard` (`item_id`);