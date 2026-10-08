import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { Pool } from "pg";
const database = process.env.SMOKE_DATABASE_URL;
if (!database || new URL(database).pathname !== "/nachtrag_deploy_test")
  throw new Error("Use only an isolated nachtrag_deploy_test database.");
const origin = "https://deployment-smoke.invalid",
  base = "http://127.0.0.1:3200";
const secret = randomBytes(32).toString("base64url");
const app = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: {
    ...process.env,
    RENDER: "true",
    RENDER_EXTERNAL_URL: origin,
    APP_ORIGIN: "",
    PORT: "3200",
    DATABASE_URL: database,
    HOST_SECRET: secret,
    SCHEDULER_SECRET: randomBytes(32).toString("base64url"),
    ALLOW_INSECURE_LOCAL: "",
  },
  stdio: ["ignore", "ignore", "pipe"],
});
// Log no child credentials or request data; failures are summarized by this runner.
app.stderr.resume();
let cookie = "";
async function post(path, data, session = cookie) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: session,
    },
    body: JSON.stringify(data),
  });
  if (!r.ok)
    throw new Error(
      `Deployment smoke operation failed (${r.status}, ${path}).`,
    );
  return { response: r, data: await r.json() };
}
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(base + "/api/ready");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server startup is bounded and retried. */
    }
    if (app.exitCode !== null)
      throw new Error("Managed service exited before readiness.");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready)
    throw new Error("Managed database and scheduler readiness failed.");
  const login = await post("/api/host/login", { secret });
  const setCookies = login.response.headers.getSetCookie();
  if (
    !setCookies.every((c) => /;\s*Secure/i.test(c) && /;\s*HttpOnly/i.test(c))
  )
    throw new Error("Production session cookie is not secure.");
  cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  const getHost = async () =>
    (
      await fetch(base + "/api/host/state?mode=test", {
        headers: { Cookie: cookie },
      })
    ).json();
  let state = await getHost();
  const cmd = async (action, extra = {}) => {
    const r = await post("/api/host/command", {
      mode: "test",
      runId: state.id,
      requestId: randomUUID(),
      action,
      ...extra,
    });
    state = r.data;
  };
  await cmd("reset", { reason: "Isolated deployment smoke run" });
  let playerCookie = "";
  for (let i = 1; i <= 4; i++) {
    const r = await post("/api/host/link", { mode: "test", playerId: `p${i}` });
    if (i === 2) {
      const exchange = await post(
        "/api/player/exchange",
        { token: r.data.link.split("#")[1] },
        "",
      );
      playerCookie = exchange.response.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
    }
  }
  await cmd("preflight");
  await cmd("arm");
  await cmd("start");
  await cmd("advance", { ms: 120000 });
  const player = await (
    await fetch(base + "/api/player/state", {
      headers: { Cookie: playerCookie },
    })
  ).json();
  if (player.content?.eventId !== "signal")
    throw new Error("Player delivery failed.");
  await post(
    "/api/player/interaction",
    {
      runId: state.id,
      eventId: "signal",
      value: "ack",
      requestId: randomUUID(),
    },
    playerCookie,
  );
  await cmd("advance", { ms: 30000 });
  state = await getHost();
  if (state.events.find((e) => e.id === "choice")?.status !== "DELIVERED")
    throw new Error("Atomic followup failed.");
  await cmd("pause");
  await cmd("resume");
  await cmd("stop");
  const stopped = await (
    await fetch(base + "/api/player/state", {
      headers: { Cookie: playerCookie },
    })
  ).json();
  if (stopped.state !== "STOPPED" || stopped.content !== null)
    throw new Error("Persistent safety failed.");
  const pool = new Pool({ connectionString: database });
  const result = await pool.query("SELECT data FROM control_state WHERE id=1");
  await pool.end();
  if (result.rows[0].data.runs.test.state !== "STOPPED")
    throw new Error("PostgreSQL persistence failed.");
  console.log(
    "Deployment smoke PASS: supervised server + worker, PostgreSQL, secure sessions, player delivery, atomic followup and STOP.",
  );
} finally {
  const exited = once(app, "exit");
  app.kill("SIGTERM");
  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, 6500)),
  ]);
  if (app.exitCode === null) app.kill("SIGKILL");
}
