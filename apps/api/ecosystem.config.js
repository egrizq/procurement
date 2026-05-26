module.exports = {
	apps: [
		{
			name: "backend-proc",
			script: "./dist/server.js",
			instances: "max", // Use all available CPU cores
			exec_mode: "cluster", // Enable cluster mode for load balancing
			env_production: {
				NODE_ENV: "production",
				PORT: 3000,
			},
			env_development: {
				NODE_ENV: "development",
				PORT: 3000,
			},
			// Auto-restart configuration
			watch: false, // Disable watch in production
			max_memory_restart: "500M", // Restart if memory exceeds 500MB

			// Error and output logs
			error_file: "./logs/pm2-error.log",
			out_file: "./logs/pm2-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			merge_logs: true,

			// Graceful shutdown
			kill_timeout: 5000, // Wait 5 seconds for graceful shutdown
			wait_ready: true, // Wait for app to be ready
			listen_timeout: 10000, // Wait 10 seconds for app to listen

			// Auto-restart on failure
			autorestart: true,
			max_restarts: 10,
			min_uptime: "10s", // Minimum uptime to not be considered unstable

			// Cron restart (optional - restart every day at 3 AM)
			// cron_restart: "0 3 * * *",

			// Source map support
			source_map_support: true,

			// Instance variables
			instance_var: "INSTANCE_ID",
		},
	],
};
