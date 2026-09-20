import { spawn } from "node:child_process";

// Explicit empty provider values take precedence over any existing .env.local.
const env = {
  ...process.env,
  APP_ENV: "local",
  CLUB_MODE: "demo",
  SITE_URL: "http://localhost:3120",
  SUPABASE_URL: "",
  SUPABASE_PUBLISHABLE_KEY: "",
  SUPABASE_SECRET_KEY: "",
  AUTH_EMAIL_ENABLED: "false",
};
delete env.VERCEL;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3120",
  ],
  { env, stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGINT", () => child.kill("SIGINT"));
