import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.{test,spec}.{js,ts}"],
		exclude: ["node_modules", "dist", "build"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"src/**/*.test.{js,ts}",
				"src/**/*.spec.{js,ts}",
			],
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
