import express, { Router } from "express";
import apiAuth from "#modules/auth/auth.middleware.ts";
import notificationController from "./notification.controller.ts";

const router: Router = express.Router();

// SSE stream — must be GET so EventSource can connect
router.get("/sse", apiAuth(), notificationController.sseStream);

// Paginated notification list
router.get("/list", apiAuth(), notificationController.getNotifications);

// Unread badge count
router.get(
	"/unread-count",
	apiAuth(),
	notificationController.getUnreadCount,
);

// Mark single notification as read
router.patch(
	"/:id/read",
	apiAuth(),
	notificationController.markAsRead,
);

// Mark all as read
router.patch(
	"/read-all",
	apiAuth(),
	notificationController.markAllAsRead,
);

export default router;
