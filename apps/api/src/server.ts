// Load environment variables FIRST before any other imports
import "./env.ts";

import type { Server } from "http";
import app from "./app.ts";
import db from "./config/database.ts";

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

db.getConnection()
	.then(() => {
		console.log("Database connected...");
	})
	.catch((err) => {
		console.error("Unable to connect to the database:", err);
		process.exit(1);
	});

const server: Server = app.listen(PORT, () => {
	console.log(`Server is running in http://${HOST}:${PORT}`);

	// Notify PM2 that the app is ready
	if (process.send) {
		process.send("ready");
	}
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
	console.log(`\n${signal} received. Starting graceful shutdown...`);

	server.close(() => {
		console.log("HTTP server closed");

		// Close database connection
		db.end()
			.then(() => {
				console.log("Database connection closed");
				process.exit(0);
			})
			.catch((err) => {
				console.error("Error closing database connection:", err);
				process.exit(1);
			});
	});

	// Force shutdown after 10 seconds
	setTimeout(() => {
		console.error("Forced shutdown after timeout");
		process.exit(1);
	}, 10000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	gracefulShutdown("unhandledRejection");
});
