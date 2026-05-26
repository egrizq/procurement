import "./src/env.ts";
import type { Config } from "drizzle-kit";

export default {
	schema: "./src/db/schema/index.ts",
	out: "./drizzle",
	dialect: "mysql",
	dbCredentials: {
		host: process.env.DB_HOST || "localhost",
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "root",
		database: process.env.DB_NAME || "procurement",
	},
	migrations: {
		table: "migrations",
	},
} satisfies Config;
