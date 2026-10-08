import { spawn } from "node:child_process";
import { productionConfig } from "./production-config.mjs";
const { origin, port } = productionConfig(process.env);
const env = { ...process.env, APP_ORIGIN: origin, NODE_ENV: "production" };
let worker,
  stopping = false;
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "0.0.0.0",
    "--port",
    String(port),
  ],
  { env, stdio: "inherit" },
);
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  app.kill("SIGTERM");
  worker?.kill("SIGTERM");
  const deadline = setTimeout(() => {
    app.kill("SIGKILL");
    worker?.kill("SIGKILL");
    process.exit(code);
  }, 5000);
  const finish = () => {
    if (app.exitCode !== null && (!worker || worker.exitCode !== null)) {
      clearTimeout(deadline);
      process.exit(code);
    }
  };
  app.once("close", finish);
  worker?.once("close", finish);
  finish();
}
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => shutdown(0));
app.on("error", () => shutdown(1));
app.on("exit", () => {
  if (!stopping) shutdown(1);
});
try {
  const deadline = Date.now() + 60000;
  while (!stopping) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (r.ok) break;
    } catch {
      /* Retry bounded readiness checks while the server initializes. */
    }
    if (Date.now() > deadline)
      throw new Error("Database/server startup did not become ready.");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!stopping) {
    worker = spawn(process.execPath, ["scripts/scheduler.mjs"], {
      env: { ...env, SCHEDULER_ORIGIN: `http://127.0.0.1:${port}` },
      stdio: "inherit",
    });
    worker.on("error", () => shutdown(1));
    worker.on("exit", () => {
      if (!stopping) shutdown(1);
    });
  }
} catch {
  console.error(
    "Managed startup failed. Check database access and deployment configuration.",
  );
  shutdown(1);
}
