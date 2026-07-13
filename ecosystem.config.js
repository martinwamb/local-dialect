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
    // Content workers run inside the server's shared 22:00-06:00 UTC Ollama
    // off-peak window. Minutes are chosen to avoid the `learn`/`port`/
    // `publisher-site` cron jobs already scheduled in that same window
    // (23:15, 02:00, 02:30, 03:00, 04:30) — recheck against `crontab -l` and
    // `pm2 list` on the server before changing these.
    {
      name: "content-worker",
      script: "node_modules/.bin/tsx",
      args: "scripts/import-content.ts",
      cwd: "/home/admin/apps/local-dialect",
      cron_restart: "15 0 * * *",
      autorestart: false,
      watch: false,
      env: { NODE_ENV: "production" },
    },
    {
      name: "story-worker",
      script: "node_modules/.bin/tsx",
      args: "scripts/generate-stories.ts",
      cwd: "/home/admin/apps/local-dialect",
      cron_restart: "45 0 * * *",
      autorestart: false,
      watch: false,
      env: { NODE_ENV: "production" },
    },
  ],
};
