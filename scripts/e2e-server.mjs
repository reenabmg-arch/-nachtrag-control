import { spawn } from "node:child_process";
const env = { ...process.env, SQLITE_PATH: `.data/e2e-${process.pid}.sqlite` };
if (env.DATABASE_URL && new URL(env.DATABASE_URL).pathname !== "/nachtrag_e2e")
  throw new Error("E2E database must be the disposable nachtrag_e2e database.");
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", "3100"],
  { env, stdio: "inherit" },
);
let worker;
const stop = () => {
  app.kill("SIGTERM");
  worker?.kill("SIGTERM");
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
app.on("exit", (code) => {
  worker?.kill("SIGTERM");
  process.exit(code ?? 1);
});
while (true) {
  try {
    const r = await fetch("http://localhost:3100/api/health");
    if (r.ok) break;
  } catch {
    /* The readiness request retries while Next is starting. */
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
}
worker = spawn(process.execPath, ["scripts/scheduler.mjs"], {
  env,
  stdio: "inherit",
});
