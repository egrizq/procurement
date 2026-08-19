import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.integration.test.ts"],
		setupFiles: ["src/test/integration/setup.ts"],
		fileParallelism: false,
		maxWorkers: 1,
		testTimeout: 10_000,
		hookTimeout: 30_000,
		env: {
			NODE_ENV: "test",
			DB_HOST: "127.0.0.1",
			DB_PORT: "3307",
			DB_USER: "root",
			DB_PASSWORD: "root",
			DB_NAME: "procurement_test",
			API_TOKEN_SECRET: "x-api-token",
			LOG_LEVEL: "silent",
		},
	},
	resolve: {
		alias: {
			"#shared": path.resolve(__dirname, "./src/shared"),
			"#modules": path.resolve(__dirname, "./src/modules"),
			"#config": path.resolve(__dirname, "./src/config"),
		},
	},
});
