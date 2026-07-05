import type { Request, Response } from "express";
import asyncHandler from "#shared/utils/asyncHandler.ts";
import { success } from "#shared/utils/response.ts";
import AppError from "#shared/utils/error.ts";
import getPaginationMeta from "#shared/utils/paginate.ts";
import NotificationRepository from "./notification.repository.ts";
import {
	addSseClient,
	removeSseClient,
} from "#shared/utils/notificationService.ts";

const notifRepo = new NotificationRepository();

/**
 * GET /notifications/list
 * Returns paginated notifications for the current user.
 */
const getNotifications = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const { page = 1, limit = 20 } = req.query;

	const result = await notifRepo.getByUserId(
		userId,
		Number(page),
		Number(limit),
	);
	const pagination = getPaginationMeta(
		Number(page),
		Number(limit),
		result.total,
	);

	return success(res, { notifications: result.items, pagination });
});

/**
 * GET /notifications/unread-count
 * Returns the count of unread notifications for the current user.
 */
const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const count = await notifRepo.getUnreadCount(userId);
	return success(res, { count });
});

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
const markAsRead = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	const id = Number(req.params.id);

	if (Number.isNaN(id)) throw new AppError("Invalid notification ID", 400);

	await notifRepo.markAsRead(id, userId);
	return success(res, { message: "Notification marked as read" });
});

/**
 * PATCH /notifications/read-all
 * Marks all notifications as read for the current user.
 */
const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;
	await notifRepo.markAllAsRead(userId);
	return success(res, { message: "All notifications marked as read" });
});

/**
 * GET /notifications/sse
 * Opens a Server-Sent Events stream for real-time notifications.
 * The client keeps this connection open and receives events as they occur.
 */
const sseStream = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.apiToken!.userId;

	// SSE headers
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
	res.flushHeaders();

	// Register this client
	addSseClient(userId, res);

	// Send an initial ping to confirm connection
	res.write(`data: ${JSON.stringify({ type: "connected", userId })}\n\n`);

	// Heartbeat every 25s to prevent proxy timeouts
	const heartbeat = setInterval(() => {
		try {
			res.write(`: ping\n\n`);
		} catch {
			clearInterval(heartbeat);
		}
	}, 25_000);

	// Cleanup on client disconnect
	req.on("close", () => {
		clearInterval(heartbeat);
		removeSseClient(userId, res);
	});
});

export default {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	sseStream,
};
