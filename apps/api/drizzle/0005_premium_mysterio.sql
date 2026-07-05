CREATE TABLE `moc_saw_weight_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moc_id` int NOT NULL,
	`unit_price_weight` decimal(5,4) NOT NULL,
	`available_qty_weight` decimal(5,4) NOT NULL,
	`warranty_weight` decimal(5,4) NOT NULL,
	`discount_weight` decimal(5,4) NOT NULL,
	`reason` text,
	`status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
	`requested_by` int NOT NULL,
	`requested_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`reject_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moc_saw_weight_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`entity_type` varchar(50),
	`entity_id` int,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`action` enum('CREATE','UPDATE','DELETE','APPROVE','REJECT','REVIEW','SAW_SCORE','SAW_WEIGHT_REQUEST','SAW_WEIGHT_REVIEW') NOT NULL,
	`module` enum('vessel_request','moc','purchase_order','good_receipt') NOT NULL,
	`entity_id` int NOT NULL,
	`entity_code` varchar(100),
	`description` text NOT NULL,
	`before_data` text,
	`after_data` text,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mocs` ADD `active_saw_weight_request_id` int;--> statement-breakpoint
ALTER TABLE `good_receipts` ADD `attachments` text;--> statement-breakpoint
ALTER TABLE `moc_saw_weight_requests` ADD CONSTRAINT `moc_saw_weight_requests_moc_id_mocs_id_fk` FOREIGN KEY (`moc_id`) REFERENCES `mocs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moc_saw_weight_requests` ADD CONSTRAINT `moc_saw_weight_requests_requested_by_users_id_fk` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moc_saw_weight_requests` ADD CONSTRAINT `moc_saw_weight_requests_reviewed_by_users_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_saw_weight_req_moc_id` ON `moc_saw_weight_requests` (`moc_id`);--> statement-breakpoint
CREATE INDEX `idx_saw_weight_req_status` ON `moc_saw_weight_requests` (`status`);--> statement-breakpoint
CREATE INDEX `saw_weight_req_requested_by_fkey` ON `moc_saw_weight_requests` (`requested_by`);--> statement-breakpoint
CREATE INDEX `saw_weight_req_reviewed_by_fkey` ON `moc_saw_weight_requests` (`reviewed_by`);--> statement-breakpoint
CREATE INDEX `idx_notifications_user_id` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_is_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_audit_user_id` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_module` ON `audit_logs` (`module`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`module`,`entity_id`);