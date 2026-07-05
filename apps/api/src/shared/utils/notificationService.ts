import type { Response } from "express";
import db from "#config/drizzle.ts";
import { notifications, users } from "../../db/schema/index.ts";
import { inArray } from "drizzle-orm";

// ─── SSE Client Registry ──────────────────────────────────────────────────────
// Maps userId → list of open SSE Response objects
const sseClients = new Map<number, Response[]>();

export function addSseClient(userId: number, res: Response) {
	const existing = sseClients.get(userId) ?? [];
	sseClients.set(userId, [...existing, res]);
}

export function removeSseClient(userId: number, res: Response) {
	const existing = sseClients.get(userId) ?? [];
	const updated = existing.filter((r) => r !== res);
	if (updated.length === 0) {
		sseClients.delete(userId);
	} else {
		sseClients.set(userId, updated);
	}
}

function pushToUser(userId: number, payload: object) {
	const clients = sseClients.get(userId) ?? [];
	const data = JSON.stringify(payload);
	clients.forEach((res) => {
		try {
			res.write(`data: ${data}\n\n`);
		} catch {
			// Client disconnected — will be cleaned up via close event
		}
	});
}

// ─── Core Function ────────────────────────────────────────────────────────────
export async function createNotification(params: {
	userId: number;
	type: string;
	title: string;
	message: string;
	entityType?: string;
	entityId?: number;
}) {
	const [inserted] = await db.insert(notifications).values({
		userId: params.userId,
		type: params.type,
		title: params.title,
		message: params.message,
		entityType: params.entityType ?? null,
		entityId: params.entityId ?? null,
		isRead: false,
	});

	const notification = {
		id: inserted.insertId,
		...params,
		isRead: false,
		createdAt: new Date().toISOString(),
	};

	// Push SSE event to user if online
	pushToUser(params.userId, { type: "notification", data: notification });

	return notification;
}

// ─── Bulk Notify (e.g. notify all Managers/Admins) ───────────────────────────
export async function notifyUsersByType(
	userTypes: string[],
	params: {
		type: string;
		title: string;
		message: string;
		entityType?: string;
		entityId?: number;
	},
) {
	const targets = await db.query.users.findMany({
		where: inArray(users.type, userTypes as any[]),
		columns: { id: true },
	});

	await Promise.all(
		targets.map((u) => createNotification({ userId: u.id, ...params })),
	);
}
