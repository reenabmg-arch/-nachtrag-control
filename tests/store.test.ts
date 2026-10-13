import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SqliteStore } from "../src/server/store";
import { command, interact, RealClock, tick } from "../src/domain/engine";
import { hash, requireSession } from "../src/server/auth";
const c = new RealClock();
function enterEvening(r: Parameters<typeof command>[0]) {
  for (const action of ["preflight", "arm", "start"] as const)
    command(r, { action }, c, action, action, ["p1", "p2", "p3", "p4"]);
  for (const [index, name] of ["reena", "janine", "jessy", "melle"].entries())
    interact(r, `p${index + 1}`, `prelude-${name}`, "ack", c, `prelude-${name}`);
  command(r, { action: "evening" }, c, "evening", "evening");
}
describe("Persistent transactional storage", () => {
  it("commits player interaction, anchor and dependent readiness together and survives reopening", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nachtrag-"));
    let db = new SqliteStore(join(dir, "state.sqlite"));
    await db.transact((s) => {
      const r = s.runs.test;
      enterEvening(r);
      command(r, { action: "advance", ms: 30 * 60_000 }, c, "adv-1", "adv-1");
      command(r, { action: "advance", ms: 12 * 60_000 }, c, "adv-2", "adv-2");
      interact(r, "p2", "signal", "ack", c, "i");
    });
    await db.close();
    db = new SqliteStore(join(dir, "state.sqlite"));
    await db.transact((s) => {
      expect(s.runs.test.interactions).toHaveLength(5);
      expect(s.runs.test.anchors.JANINE_OPENED).toBe(42 * 60_000);
      expect(s.runs.test.events.find((event) => event.id === "choice")?.status).toBe("WAITING");
    });
    await db.close();
    rmSync(dir, { recursive: true });
  });
  it("rolls back partial commands and multiple connections cannot duplicate an execution", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nachtrag-"));
    const a = new SqliteStore(join(dir, "state.sqlite")),
      b = new SqliteStore(join(dir, "state.sqlite"));
    await expect(
      a.transact((s) => {
        s.runs.test.state = "STOPPED";
        throw new Error("abort");
      }),
    ).rejects.toThrow();
    await b.transact((s) => expect(s.runs.test.state).toBe("DRAFT"));
    await a.transact((s) => {
      const r = s.runs.test;
      enterEvening(r);
      r.virtualNow += 42 * 60_000;
    });
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        (i % 2 ? a : b).transact((s) => tick(s.runs.test, c)),
      ),
    );
    await a.transact((s) =>
      expect(
        s.runs.test.audit.filter(
          (x) => x.action === "EVENT_DELIVERED" && x.eventId === "signal",
        ),
      ).toHaveLength(1),
    );
    await b.transact((s) =>
      command(s.runs.test, { action: "stop" }, c, "stop", "stop"),
    );
    await a.transact((s) => {
      s.runs.test.virtualNow += 999999;
      tick(s.runs.test, c);
      expect(s.runs.test.state).toBe("STOPPED");
      expect(s.runs.live.state).toBe("DRAFT");
    });
    await a.close();
    await b.close();
    rmSync(dir, { recursive: true });
  });
  it("separates host/player roles and enforces expired and revoked sessions", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nachtrag-"));
    const db = new SqliteStore(join(dir, "state.sqlite"));
    await db.transact((s) => {
      s.access.push({
        hash: hash("link"),
        mode: "test",
        playerId: "p2",
        createdAt: 0,
        revokedAt: null,
        consumedAt: 0,
      });
      s.sessions.push({
        hash: hash("player"),
        role: "player",
        mode: "test",
        playerId: "p2",
        expires: Date.now() + 10000,
        accessHash: hash("link"),
      });
      expect(requireSession(s, "player", "player").playerId).toBe("p2");
      expect(() => requireSession(s, "player", "host")).toThrow();
      s.access[0].revokedAt = 1;
      expect(() => requireSession(s, "player", "player")).toThrow();
    });
    await db.close();
    rmSync(dir, { recursive: true });
  });
});
