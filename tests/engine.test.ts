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
  for (let i = 1; i <= 4; i++)
    interact(
      run,
      `p${i}`,
      `prelude-${["reena", "janine", "jessy", "melle"][i - 1]}`,
      "ack",
      clock,
      `prelude-${i}`,
    );
  command(run, { action: "evening" }, clock, "evening", "evening", links);
  return { run, clock };
}
function advance(
  run: ReturnType<typeof createRun>,
  clock: VirtualClock,
  ms: number,
  key = "advance",
) {
  let remaining = ms;
  let part = 0;
  while (remaining > 0) {
    const chunk = Math.min(remaining, 1_800_000);
    command(
      run,
      { action: "advance", ms: chunk },
      clock,
      `${key}-${part}`,
      `${key}:${part}:${chunk}`,
    );
    remaining -= chunk;
    part++;
  }
}
describe("Domain engine", () => {
  it("validates the immutable production scenario and detects dependency cycles, missing targets/content/anchors", () => {
    const { run } = ready();
    expect(validateEvents(run.events)).toEqual([]);
    run.events.find((event) => event.id === "signal")!.dependencies = [
      { eventId: "choice", status: "ACKNOWLEDGED" },
    ];
    expect(validateEvents(run.events).join()).toContain("Zyklus");
    run.events.find((event) => event.id === "signal")!.target = [];
    run.events.find((event) => event.id === "signal")!.fallbackAction = "";
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
  it("executes the production opening including acknowledgement, anchor, choice and branch cancellation", () => {
    const { run, clock } = ready();
    advance(run, clock, 42 * 60_000);
    expect(run.players[1].content?.eventId).toBe("signal");
    interact(run, "p2", "signal", "ack", clock, "ack");
    expect(run.anchors.JANINE_OPENED).toBe(42 * 60_000);
    expect(run.events.find((event) => event.id === "choice")?.status).toBe("WAITING");
    advance(run, clock, 90_000, "next");
    expect(run.players[2].content?.eventId).toBe("choice");
    interact(run, "p3", "choice", "STIMMEN ZUERST", clock, "choice");
    expect(run.events.find((e) => e.id === "branch-a")?.status).toBe(
      "CANCELLED",
    );
    expect(run.players.every((p) => p.content?.eventId === "branch-b")).toBe(
      true,
    );
  });
  it("converges both dramaturgical paths through false ending, verification and four-person finale", () => {
    const { run, clock } = ready();
    advance(run, clock, 42 * 60_000);
    interact(run, "p2", "signal", "ack", clock, "opening");
    advance(run, clock, 90_000, "choice-due");
    interact(run, "p3", "choice", "SPUREN ZUERST", clock, "branch");
    advance(run, clock, 8 * 60_000, "false-ending");
    expect(run.state).toBe("FALSE_ENDING");
    expect(
      run.events.filter((event) => event.id.startsWith("false-") && event.status === "DELIVERED"),
    ).toHaveLength(4);
    interact(run, "p4", "verify", "ack", clock, "verify");
    advance(run, clock, 90_000, "reactivate");
    expect(run.state).toBe("REACTIVATING");
    interact(run, "p1", "reactivate", "ack", clock, "reena");
    for (let i = 1; i <= 4; i++)
      interact(
        run,
        `p${i}`,
        `testimony-p${i}`,
        `Dieser Satz entstand erst jetzt ${i}.`,
        clock,
        `testimony-${i}`,
      );
    expect(run.state).toBe("FINAL_ACT");
    expect(run.players.every((player) => player.content?.eventId === "finale")).toBe(true);
  });
  it("freezes story time during a long pause and preserves remaining anchor-relative delay", () => {
    const { run, clock } = ready();
    advance(run, clock, 41 * 60_000);
    command(run, { action: "pause" }, clock, "pause", "pause");
    advance(run, clock, 1_200_000, "paused");
    expect(storyTime(run, run.virtualNow)).toBe(41 * 60_000);
    expect(run.players[1].content?.eventId).toBe("prelude-janine");
    command(run, { action: "resume" }, clock, "resume", "resume");
    advance(run, clock, 59_999, "almost");
    expect(run.players[1].content?.eventId).toBe("prelude-janine");
    advance(run, clock, 1, "due");
    expect(run.players[1].content?.eventId).toBe("signal");
  });
  it("claims once under repeated ticks, repeated commands and acknowledgement replays", () => {
    const { run, clock } = ready();
    const baseline = run.audit.filter((a) => a.action === "EVENT_DELIVERED").length;
    advance(run, clock, 42 * 60_000);
    for (let i = 0; i < 20; i++) tick(run, clock);
    expect(
      run.audit.filter((a) => a.action === "EVENT_DELIVERED"),
    ).toHaveLength(baseline + 1);
    interact(run, "p2", "signal", "ack", clock, "a");
    interact(run, "p2", "signal", "ack", clock, "b");
    expect(run.interactions).toHaveLength(5);
    expect(() =>
      command(
        run,
        { action: "advance", ms: 60000 },
        clock,
        "advance-0",
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
    advance(run, clock, 42 * 60_000);
    expect(run.players[1].content).toBeNull();
    expect(run.players[1].safety).toBe(true);
    expect(() => interact(run, "p2", "signal", "ack", clock, "a")).toThrow();
  });
  it("rejects cross-player access and invalid choices", () => {
    const { run, clock } = ready();
    advance(run, clock, 42 * 60_000);
    expect(() => interact(run, "p1", "signal", "ack", clock, "a")).toThrow();
    expect(() =>
      interact(run, "p2", "signal", "invalid", clock, "b"),
    ).toThrow();
    expect(run.interactions).toHaveLength(4);
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
    advance(run, clock, 42 * 60_000);
    expect(run.players[1].content?.eventId).toBe("prelude-janine");
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
    expect(run.events.find((event) => event.id === "branch-a")?.status).toBe("CANCELLED");
  });
  it("supports real clocks and explicit late-event policies without active browser clients", () => {
    const clock = new VirtualClock(1000000),
      run = createRun("live", clock.now(), "live");
    command(run, { action: "preflight" }, clock, "p", "p", links);
    command(run, { action: "arm" }, clock, "a", "a", links);
    command(run, { action: "start" }, clock, "s", "s", links);
    for (const [index, name] of ["reena", "janine", "jessy", "melle"].entries())
      interact(run, `p${index + 1}`, `prelude-${name}`, "ack", clock, `p-${name}`);
    command(run, { action: "evening" }, clock, "e", "e", links);
    run.events.find((event) => event.id === "signal")!.latePolicy = "SKIP_IF_LATE";
    run.events.find((event) => event.id === "signal")!.lateThreshold = 1;
    clock.advance(50 * 60_000);
    tick(run, clock);
    expect(run.events.find((event) => event.id === "signal")?.status).toBe("SKIPPED");
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
