import { test, expect, type Page, type BrowserContext } from "@playwright/test";
const secret = "e2e-host-secret-32-character-minimum-secure";
const origin = "http://localhost:3100";
async function post(page: Page, path: string, data: unknown) {
  return page.evaluate(
    async ({ path, data }) => {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return { status: r.status, data: await r.json() };
    },
    { path, data },
  );
}
async function login(page: Page) {
  await page.goto("/control");
  await page.getByLabel("Host-Zugang", { exact: true }).fill(secret);
  await page.getByRole("button", { name: "Control öffnen" }).click();
  await expect(
    page.getByRole("heading", { name: "Der Abend. Unter Kontrolle." }),
  ).toBeVisible();
}
async function state(page: Page, mode = "test") {
  return page.evaluate(
    async (mode) => (await fetch(`/api/host/state?mode=${mode}`)).json(),
    mode,
  );
}
async function cmd(
  page: Page,
  action: string,
  extra: Record<string, unknown> = {},
) {
  const s = await state(page);
  return post(page, "/api/host/command", {
    mode: "test",
    runId: s.id,
    requestId: crypto.randomUUID(),
    action,
    ...extra,
  });
}
async function prepare(page: Page) {
  const s = await state(page);
  if (s.state !== "DRAFT")
    await cmd(page, "reset", { reason: "E2E isolation" });
  const urls: Record<string, string> = {};
  for (let i = 1; i <= 4; i++) {
    const r = await post(page, "/api/host/link", {
      mode: "test",
      playerId: `p${i}`,
    });
    expect(r.status).toBe(200);
    urls[`p${i}`] = origin + r.data.link;
  }
  expect((await cmd(page, "preflight")).status).toBe(200);
  expect((await cmd(page, "arm")).status).toBe(200);
  expect((await cmd(page, "start")).status).toBe(200);
  return urls;
}
test("Milestone 1: real mobile multi-player end-to-end", async ({
  page,
  browser,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  const securityHeaders = (await page.request.get("/control")).headers();
  expect(securityHeaders["referrer-policy"]).toBe("no-referrer");
  expect(securityHeaders["x-content-type-options"]).toBe("nosniff");
  expect(
    securityHeaders["content-security-policy"].match(/script-src[^;]+/)?.[0],
  ).toContain("'nonce-");
  expect(
    securityHeaders["content-security-policy"].match(/script-src[^;]+/)?.[0],
  ).not.toContain("unsafe-inline");
  await cmd(page, "reset", { reason: "Start full E2E" });
  await page.reload();
  // PRE-FLIGHT really blocks before all four access links exist (revoke any previous run links).
  for (let i = 1; i <= 4; i++)
    await post(page, "/api/host/link", {
      mode: "test",
      playerId: `p${i}`,
      revoke: true,
    });
  await page.getByRole("button", { name: "PRE-FLIGHT", exact: true }).click();
  await expect(page.getByText("FAIL", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ARM", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Live Control", exact: true }).click();
  const contexts: BrowserContext[] = [],
    players: Page[] = [];
  for (const name of ["Reena", "Janine", "Jessy", "Melle"]) {
    const card = page
      .locator(".player-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await card
      .getByRole("button", { name: "Player-Link erzeugen", exact: true })
      .click();
    const url = await page
      .getByLabel(`${name} Player-Link`, { exact: true })
      .inputValue();
    expect(url.split("#")[1]).toHaveLength(43);
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
    });
    contexts.push(context);
    const player = await context.newPage();
    players.push(player);
    player.on("pageerror", (e) => errors.push(e.message));
    await player.goto(url);
    await expect(player).toHaveURL(/\/p$/);
    await expect(
      player.getByRole("heading", { name: "Im Moment ist alles ruhig." }),
    ).toBeVisible();
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "nc_player")?.httpOnly).toBe(true);
    expect(cookies.find((c) => c.name === "nc_player")?.sameSite).toBe(
      "Strict",
    );
  }
  await expect
    .poll(async () => (await state(page)).scheduler.healthy)
    .toBe(true);
  await page.getByRole("button", { name: "PRE-FLIGHT", exact: true }).click();
  await expect(page.getByText("FAIL", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "ARM", exact: true }).click();
  await page.getByRole("button", { name: "LIVE starten", exact: true }).click();
  await page.getByRole("button", { name: "Zeit +1 Min.", exact: true }).click();
  await expect(page.locator(".status-strip")).toContainText("00:01:00");
  await page.getByRole("button", { name: "PAUSE", exact: true }).click();
  await page.getByRole("button", { name: "Zeit +5 Min.", exact: true }).click();
  await expect(page.locator(".status-strip")).toContainText("00:01:00");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "RESUME", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await page.getByRole("button", { name: "Zeit +1 Min.", exact: true }).click();
  await expect(
    players[1].getByRole("heading", { name: "DEMO · Ein erstes Signal" }),
  ).toBeVisible();
  // Player endpoint contains no scenario, tokens, sibling players or future content.
  const redacted = await players[1].evaluate(async () =>
    JSON.stringify(await (await fetch("/api/player/state")).json()),
  );
  expect(redacted).not.toContain("Zwei Wege");
  expect(redacted).not.toContain("branch-b");
  expect(redacted).not.toContain("token");
  await players[1].getByRole("button", { name: "Empfang bestätigen" }).click();
  await expect(
    players[1].getByText("Antwort gespeichert.", { exact: true }),
  ).toBeVisible();
  await players[1].reload();
  await expect(
    players[1].getByText("Antwort gespeichert.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zeit +1 Min.", exact: true }).click();
  await expect(
    players[2].getByRole("heading", { name: "DEMO · Zwei Wege" }),
  ).toBeVisible();
  await players[2].getByRole("button", { name: "Weg B", exact: true }).click();
  await expect(
    players[0].getByRole("heading", { name: "DEMO · Weg B" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".player-card")
      .filter({
        has: page.getByRole("heading", { name: "Jessy", exact: true }),
      }),
  ).toContainText("Antwort: B");
  const manual = page
    .locator(".event-row")
    .filter({ hasText: "Manueller Hinweis" });
  await manual.getByRole("button", { name: "Auslösen", exact: true }).click();
  await page.getByLabel("Begründung").fill("E2E: Host korrigiert den Ablauf");
  await page.getByRole("button", { name: "Änderung bestätigen" }).click();
  await expect(
    players[3].getByRole("heading", { name: "DEMO · Manueller Hinweis" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("control-mobile.png"),
    fullPage: true,
  });
  await players[1].screenshot({
    path: testInfo.outputPath("player-mobile.png"),
    fullPage: true,
  });
  for (const screen of [page, ...players])
    expect(
      await screen.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  await page.getByRole("button", { name: "STOP ALL", exact: true }).click();
  await page.getByRole("button", { name: "STOP ALL bestätigen" }).click();
  for (const player of players)
    await expect(
      player.getByRole("heading", { name: "Die Experience ist gestoppt." }),
    ).toBeVisible();
  await page.reload();
  expect((await state(page)).state).toBe("STOPPED");
  expect(
    (
      await cmd(page, "fire", {
        eventId: "manual",
        reason: "Must remain stopped",
      })
    ).status,
  ).toBe(409);
  await page.getByRole("button", { name: "Event Log", exact: true }).click();
  await expect(page.getByText("OVERRIDE_FIRE", { exact: true })).toBeVisible();
  await expect(page.getByText("STOP", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Live Control", exact: true }).click();
  await page.getByRole("button", { name: "Test Reset", exact: true }).click();
  await page.getByRole("button", { name: "Test Reset bestätigen" }).click();
  expect((await state(page)).state).toBe("DRAFT");
  for (const player of players)
    await expect(
      player.getByRole("heading", { name: "Im Moment ist alles ruhig." }),
    ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("control-desktop.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  for (const context of contexts) await context.close();
});
test("Security, retries, reconnect, revocation, Safety and multi-host invariants", async ({
  page,
  browser,
}) => {
  await login(page);
  const urls = await prepare(page);
  const janineContext = await browser.newContext({
      viewport: { width: 393, height: 852 },
    }),
    jessyContext = await browser.newContext();
  const janine = await janineContext.newPage(),
    jessy = await jessyContext.newPage();
  await janine.goto(urls.p2);
  await expect(janine).toHaveURL(/\/p$/);
  await jessy.goto(urls.p3);
  await expect(jessy).toHaveURL(/\/p$/);
  expect((await janine.request.get("/api/host/state")).status()).toBe(401);
  const stranger = await browser.newContext();
  const replay = await stranger.newPage();
  await replay.goto(urls.p2);
  await expect(
    replay.getByRole("heading", { name: "Link nicht verfügbar" }),
  ).toBeVisible();
  const csrf = await page.request.post("/api/host/command", {
    headers: { Origin: "https://evil.example" },
    data: {},
  });
  expect(csrf.status()).toBe(403);
  const invalid = await page.request.post("/api/host/command", {
    headers: { Origin: origin },
    data: { mode: "test", action: "start", ms: -1 },
  });
  expect(invalid.status()).toBe(400);
  const oversized = await page.request.post("/api/host/login", {
    headers: { Origin: origin },
    data: { secret: "x".repeat(9000) },
  });
  expect(oversized.status()).toBe(413);
  await cmd(page, "advance", { ms: 120000 });
  await expect(
    janine.getByRole("button", { name: "Empfang bestätigen" }),
  ).toBeVisible();
  const s = await state(page),
    request = {
      runId: s.id,
      eventId: "signal",
      value: "ack",
      requestId: crypto.randomUUID(),
    };
  expect((await post(jessy, "/api/player/interaction", request)).status).toBe(
    403,
  );
  const duplicate = await janine.evaluate(
    async (data) =>
      Promise.all(
        [1, 2].map(async () => {
          const r = await fetch("/api/player/interaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          return r.status;
        }),
      ),
    request,
  );
  expect(duplicate).toEqual([200, 200]);
  expect(
    (await state(page)).audit.filter(
      (a: { action: string }) => a.action === "INTERACTION",
    ),
  ).toHaveLength(1);
  // A timeout after commit can be retried with the same id; command is not repeated.
  const before = await state(page),
    override = {
      mode: "test",
      runId: before.id,
      requestId: crypto.randomUUID(),
      action: "delay",
      eventId: "choice",
      reason: "Timeout retry drill",
    };
  const result = await page.evaluate(
    async (data) =>
      Promise.all(
        [1, 2].map(async () => {
          const r = await fetch("/api/host/command", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          return r.status;
        }),
      ),
    override,
  );
  expect(result).toEqual([200, 200]);
  expect(
    (await state(page)).events.find((e: { id: string }) => e.id === "choice")
      .delay,
  ).toBe(60000);
  await janineContext.setOffline(true);
  await expect(
    janine.getByText("Verbindung unterbrochen. Letzter bestätigter Stand."),
  ).toBeVisible();
  await janineContext.setOffline(false);
  await janine.reload();
  await expect(
    janine.getByText("Antwort gespeichert.", { exact: true }),
  ).toBeVisible();
  // Drop the response AFTER the server has committed: UI must report uncertainty, not fake success.
  await page.route(
    "**/api/host/command",
    async (route) => {
      await route.fetch();
      await route.abort("failed");
    },
    { times: 1 },
  );
  const choiceRow = page
    .locator(".event-row")
    .filter({ hasText: "Eine Entscheidung · Jessy" });
  await choiceRow.getByRole("button", { name: "+1 Min.", exact: true }).click();
  await page.getByLabel("Begründung").fill("Lost-response drill");
  await page.getByRole("button", { name: "Änderung bestätigen" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "AKTION NICHT BESTÄTIGT" }),
  ).toBeVisible();
  expect(
    (await state(page)).events.find((e: { id: string }) => e.id === "choice")
      .delay,
  ).toBe(120000);
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  // A delayed authoritative refetch does not fabricate state or lose an acknowledged interaction.
  await janine.route(
    "**/api/player/state",
    async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({ response });
    },
    { times: 1 },
  );
  await janine.reload();
  await expect(
    janine.getByText("Antwort gespeichert.", { exact: true }),
  ).toBeVisible();
  await cmd(page, "pause");
  await janine.getByRole("button", { name: "EXPERIENCE STOPPEN" }).click();
  await expect(
    janine.getByRole("heading", { name: "Die Experience ist gestoppt." }),
  ).toBeVisible();
  await expect(page.locator(".safety-alert")).toContainText("Janine");
  await cmd(page, "resume");
  await cmd(page, "advance", { ms: 180000 });
  await expect(
    jessy.getByRole("heading", { name: "DEMO · Zwei Wege" }),
  ).toBeVisible();
  expect(
    (
      await post(jessy, "/api/player/interaction", {
        runId: before.id,
        eventId: "choice",
        value: "<script>",
        requestId: crypto.randomUUID(),
      })
    ).status,
  ).toBe(400);
  await post(page, "/api/host/link", {
    mode: "test",
    playerId: "p3",
    revoke: true,
  });
  expect((await jessy.request.get("/api/player/state")).status()).toBe(401);
  const host2 = await browser.newContext({
      storageState: await page.context().storageState(),
    }),
    other = await host2.newPage();
  await other.goto("/control");
  const stop = cmd(other, "stop"),
    fire = cmd(page, "fire", { eventId: "manual", reason: "Race with STOP" });
  await Promise.all([stop, fire]);
  const stopped = await state(page);
  expect(stopped.state).toBe("STOPPED");
  expect(
    stopped.players.every((p: { content: unknown }) => p.content === null),
  ).toBe(true);
  const deliveries = stopped.audit.filter(
    (a: { action: string }) => a.action === "EVENT_DELIVERED",
  ).length;
  await page.waitForTimeout(1500);
  expect(
    (await state(page)).audit.filter(
      (a: { action: string }) => a.action === "EVENT_DELIVERED",
    ),
  ).toHaveLength(deliveries);
  const liveBefore = await state(page, "live");
  await cmd(page, "reset", { reason: "Isolation check" });
  expect((await state(page, "live")).id).toBe(liveBefore.id);
  expect(
    (
      await post(page, "/api/host/command", {
        mode: "live",
        runId: liveBefore.id,
        requestId: crypto.randomUUID(),
        action: "reset",
        reason: "Forbidden",
      })
    ).status,
  ).toBe(403);
  for (const context of [janineContext, jessyContext, stranger, host2])
    await context.close();
});
test("Real-clock scheduler delivers with no host or player browser open", async ({
  page,
  browser,
}) => {
  test.setTimeout(155000);
  await login(page);
  // This isolated real live run is deliberately separate from all virtual test data.
  const live = await state(page, "live");
  expect(live.state).toBe("DRAFT");
  let janineLink = "";
  for (let i = 1; i <= 4; i++) {
    const r = await post(page, "/api/host/link", {
      mode: "live",
      playerId: `p${i}`,
    });
    expect(r.status).toBe(200);
    if (i === 2) janineLink = origin + r.data.link;
  }
  for (const action of ["preflight", "arm", "start"]) {
    const r = await post(page, "/api/host/command", {
      mode: "live",
      runId: live.id,
      requestId: crypto.randomUUID(),
      action,
    });
    expect(r.status).toBe(200);
  }
  const storage = await page.context().storageState();
  await page.close();
  // No HTTP refetch / host tick during the due window. The independent worker owns it.
  await new Promise((resolve) => setTimeout(resolve, 123000));
  const context = await browser.newContext({ storageState: storage }),
    host = await context.newPage();
  await host.goto("/control");
  const result = await state(host, "live");
  expect(
    result.events.find((e: { id: string }) => e.id === "signal").status,
  ).toBe("DELIVERED");
  const entry = result.audit.find(
    (e: { action: string; eventId: string }) =>
      e.action === "EVENT_DELIVERED" && e.eventId === "signal",
  );
  expect(entry.actor).toBe("SCHEDULER");
  expect(
    entry.timestamp -
      result.audit.find((e: { action: string }) => e.action === "START")
        .timestamp,
  ).toBeLessThan(123000);
  const playerContext = await browser.newContext(),
    player = await playerContext.newPage();
  await player.goto(janineLink);
  await expect(player).toHaveURL(/\/p$/);
  await expect(
    player.getByRole("heading", { name: "DEMO · Ein erstes Signal" }),
  ).toBeVisible();
  const stop = await post(host, "/api/host/command", {
    mode: "live",
    runId: live.id,
    requestId: crypto.randomUUID(),
    action: "stop",
  });
  expect(stop.status).toBe(200);
  await expect(
    player.getByRole("heading", { name: "Die Experience ist gestoppt." }),
  ).toBeVisible();
  await playerContext.close();
  await context.close();
});
