const origin =
  process.env.SCHEDULER_ORIGIN ||
  process.env.APP_ORIGIN ||
  "http://localhost:3000";
const secret = process.env.SCHEDULER_SECRET;
if (!secret || secret.length < 32)
  throw new Error("SCHEDULER_SECRET must contain at least 32 characters.");
let running = true;
process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});
console.log(
  "Scheduler running. One-second due checks; no player or host tab required.",
);
while (running) {
  try {
    const r = await fetch(`${origin}/api/scheduler`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.error(`Scheduler request not confirmed (${r.status}).`);
  } catch {
    console.error(
      "Scheduler connection unavailable; next iteration will catch up.",
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
