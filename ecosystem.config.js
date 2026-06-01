module.exports = {
  apps: [
    {
      name: "local-dialect",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/home/admin/apps/local-dialect",
      env: { NODE_ENV: "production", PORT: 3004 },
    },
    {
      name: "email-reminders",
      script: "node_modules/.bin/tsx",
      args: "scripts/send-reminders.ts",
      cwd: "/home/admin/apps/local-dialect",
      cron_restart: "0 5 * * *",
      autorestart: false,
      watch: false,
      env: { NODE_ENV: "production" },
    },
  ],
};
