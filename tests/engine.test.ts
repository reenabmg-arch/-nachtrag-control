import { describe, it, expect } from "vitest";
import {
  command,
  createRun,
  DomainError,
  evaluate,
  interact,
  safety,
  storyTime,
  tick,
  validateEvents,
  VirtualClock,
} from "../src/domain/engine";
const links = ["p1", "p2", "p3", "p4"];
function ready() {
  const clock = new VirtualClock(1_000_000);
  const run = createRun("test", clock.now(), "run-test");
  command(run, { action: "preflight" }, clock, "pf", "pf", links);
  command(run, { action: "arm" }, clock, "arm", "arm", links);
  command(run, { action: "start" }, clock, "start", "start", links);
  return { run, clock };
}
function advance(
  run: ReturnType<typeof createRun>,
  clock: VirtualClock,
  ms: number,
  key = "advance",
) {
  command(run, { action: "advance", ms }, clock, key, `${key}:${ms}`);
}
describe("Domain engine", () => {
  it("validates the immutable demo and detects dependency cycles, missing targets/content/anchors", () => {
    const { run } = ready();
    expect(validateEvents(run.events)).toEqual([]);
    run.events[0].dependencies = [
      { eventId: "choice", status: "ACKNOWLEDGED" },
    ];
    expect(validateEvents(run.events).join()).toContain("Zyklus");
    run.events[0].target = [];
    run.events[0].fallbackAction = "";
    expect(validateEvents(run.events).join()).toContain("Fehlender");
  });
  it("blocks invalid transitions and ARM without links", () => {
    const c = new VirtualClock(1000),
      r = createRun("test", 1000, "x");
    expect(() => command(r, { action: "start" }, c, "1", "1")).toThrow(
      DomainError,
    );
    command(r, { action: "preflight" }, c, "2", "2");
    expect(r.state).toBe("DRAFT");
    expect(() => command(r, { action: "arm" }, c, "3", "3", links)).toThrow();
  });
  it("executes the whole demo including acknowledgement, anchor, choice and branch cancellation", () => {
    const { run, clock } = ready();
    advance(run, clock, 120000);
    expect(run.players[1].content?.eventId).toBe("signal");
    interact(run, "p2", "signal", "ack", clock, "ack");
    expect(run.anchors.DEMO_ACK).toBe(120000);
    expect(run.events[1].status).toBe("WAITING");
    advance(run, clock, 30000, "next");
    expect(run.players[2].content?.eventId).toBe("choice");
    interact(run, "p3", "choice", "B", clock, "choice");
    expect(run.events.find((e) => e.id === "branch-a")?.status).toBe(
      "CANCELLED",
    );
    expect(run.players.every((p) => p.content?.eventId === "branch-b")).toBe(
      true,
    );
  });
  it("freezes story time during a long pause and preserves remaining anchor-relative delay", () => {
    const { run, clock } = ready();
    advance(run, clock, 60000);
    command(run, { action: "pause" }, clock, "pause", "pause");
    advance(run, clock, 1_200_000, "paused");
    expect(storyTime(run, run.virtualNow)).toBe(60000);
    expect(run.players[1].content).toBeNull();
    command(run, { action: "resume" }, clock, "resume", "resume");
    advance(run, clock, 59999, "almost");
    expect(run.players[1].content).toBeNull();
    advance(run, clock, 1, "due");
    expect(run.players[1].content?.eventId).toBe("signal");
  });
  it("claims once under repeated ticks, repeated commands and acknowledgement replays", () => {
    const { run, clock } = ready();
    advance(run, clock, 120000);
    for (let i = 0; i < 20; i++) tick(run, clock);
    advance(run, clock, 120000);
    expect(
      run.audit.filter((a) => a.action === "EVENT_DELIVERED"),
    ).toHaveLength(1);
    interact(run, "p2", "signal", "ack", clock, "a");
    interact(run, "p2", "signal", "ack", clock, "b");
    expect(run.interactions).toHaveLength(1);
    expect(() =>
      command(
        run,
        { action: "advance", ms: 60000 },
        clock,
        "advance",
        "different",
      ),
    ).toThrow();
  });
  it("STOP is terminal for ticks, resumes, overrides and every player, including paused runs", () => {
    const { run, clock } = ready();
    command(run, { action: "pause" }, clock, "p", "p");
    command(run, { action: "stop" }, clock, "stop", "stop");
    const fired = run.audit.filter(
      (a) => a.action === "EVENT_DELIVERED",
    ).length;
    run.virtualNow += 1_000_000;
    for (let i = 0; i < 100; i++) tick(run, clock);
    expect(
      run.audit.filter((a) => a.action === "EVENT_DELIVERED"),
    ).toHaveLength(fired);
    expect(run.players.every((p) => p.content === null)).toBe(true);
    expect(() =>
      command(run, { action: "resume" }, clock, "resume", "resume"),
    ).toThrow();
    expect(() =>
      command(
        run,
        { action: "fire", eventId: "manual", reason: "test" },
        clock,
        "f",
        "f",
      ),
    ).toThrow();
  });
  it("Safety is active while paused and never overwritten by future delivery", () => {
    const { run, clock } = ready();
    command(run, { action: "pause" }, clock, "p", "p");
    safety(run, "p2", clock, "s");
    command(run, { action: "resume" }, clock, "r", "r");
    advance(run, clock, 120000);
    expect(run.players[1].content).toBeNull();
    expect(run.players[1].safety).toBe(true);
    expect(() => interact(run, "p2", "signal", "ack", clock, "a")).toThrow();
  });
  it("rejects cross-player access and invalid choices", () => {
    const { run, clock } = ready();
    advance(run, clock, 120000);
    expect(() => interact(run, "p1", "signal", "ack", clock, "a")).toThrow();
    expect(() =>
      interact(run, "p2", "signal", "invalid", clock, "b"),
    ).toThrow();
    expect(run.interactions).toHaveLength(0);
  });
  it("manual overrides log reasons, shift due time, preserve dependency gates and skip followups", () => {
    const { run, clock } = ready();
    expect(() =>
      command(
        run,
        { action: "fire", eventId: "choice", reason: "override" },
        clock,
        "f",
        "f",
      ),
    ).toThrow();
    command(
      run,
      { action: "delay", eventId: "signal", reason: "Noch nicht bereit" },
      clock,
      "delay",
      "delay",
    );
    advance(run, clock, 120000);
    expect(run.players[1].content).toBeNull();
    command(
      run,
      { action: "fire", eventId: "signal", reason: "Jetzt passt es" },
      clock,
      "fire",
      "fire",
    );
    expect(run.players[1].content?.eventId).toBe("signal");
    command(
      run,
      { action: "skip", eventId: "choice", reason: "Überspringen" },
      clock,
      "skip",
      "skip",
    );
    expect(run.events[2].status).toBe("CANCELLED");
  });
  it("supports real clocks and explicit late-event policies without active browser clients", () => {
    const clock = new VirtualClock(1000000),
      run = createRun("live", clock.now(), "live");
    command(run, { action: "preflight" }, clock, "p", "p", links);
    command(run, { action: "arm" }, clock, "a", "a", links);
    command(run, { action: "start" }, clock, "s", "s", links);
    run.events[0].latePolicy = "SKIP_IF_LATE";
    clock.advance(500000);
    tick(run, clock);
    expect(run.events[0].status).toBe("SKIPPED");
    expect(() =>
      command(run, { action: "advance", ms: 1000 }, clock, "x", "x"),
    ).toThrow();
  });
  it("evaluates nested AND/OR/NOT conditions and virtual clocks deterministically", () => {
    expect(
      evaluate(
        {
          type: "and",
          items: [
            { type: "equals", key: "a", value: true },
            { type: "not", item: { type: "equals", key: "b", value: "B" } },
          ],
        },
        { a: true, b: "A" },
      ),
    ).toBe(true);
    const c = new VirtualClock(0);
    c.advance(120);
    expect(c.now()).toBe(120);
    expect(() => c.advance(-1)).toThrow();
  });
});
