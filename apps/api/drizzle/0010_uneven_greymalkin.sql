ALTER TABLE `vessel_request_items` MODIFY COLUMN `status` enum('Ok','Approved by system','Waiting','Approved','Rejected') NOT NULL DEFAULT 'Waiting';--> statement-breakpoint
ALTER TABLE `vessel_requests` MODIFY COLUMN `status` enum('Ok','Approved by system','Waiting','Approved','Rejected') NOT NULL DEFAULT 'Waiting';--> statement-breakpoint
UPDATE `vessel_request_items` SET `status` = 'Approved by system' WHERE `status` = 'Ok';--> statement-breakpoint
UPDATE `vessel_requests` SET `status` = 'Approved by system' WHERE `status` = 'Ok';--> statement-breakpoint
ALTER TABLE `vessel_request_items` MODIFY COLUMN `status` enum('Approved by system','Waiting','Approved','Rejected') NOT NULL DEFAULT 'Waiting';--> statement-breakpoint
ALTER TABLE `vessel_requests` MODIFY COLUMN `status` enum('Approved by system','Waiting','Approved','Rejected') NOT NULL DEFAULT 'Waiting';
