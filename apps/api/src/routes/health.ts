import type { Request, Response } from "express";
import { Router } from "express";
import db from "#config/database.ts";

const router = Router();

/**
 * Health check endpoint
 * Returns the health status of the API and its dependencies
 */
router.get("/health", async (_req: Request, res: Response) => {
	try {
		// Check database connectivity
		await db.getConnection();

		return res.status(200).json({
			status: "ok",
			timestamp: new Date().toISOString(),
			service: "procurement-api",
			version: process.env.npm_package_version || "1.0.0",
			database: "connected",
			uptime: process.uptime(),
		});
	} catch (error) {
		return res.status(503).json({
			status: "error",
			timestamp: new Date().toISOString(),
			service: "procurement-api",
			database: "disconnected",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

export default router;
