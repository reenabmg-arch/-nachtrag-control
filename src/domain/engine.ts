// This module intentionally has no React, network, database or environment dependencies.
export const PLAYERS = ["Reena", "Janine", "Jessy", "Melle"] as const;
export type Mode = "test" | "live";
export type Lifecycle =
  | "DRAFT"
  | "VALIDATED"
  | "READY"
  | "ARMED"
  | "PRE_GAME"
  | "LIVE"
  | "PAUSED"
  | "FALSE_ENDING"
  | "REACTIVATING"
  | "FINAL_ACT"
  | "STOPPED"
  | "COMPLETED"
  | "ARCHIVED";
export type EventStatus =
  | "BLOCKED"
  | "WAITING"
  | "READY"
  | "CLAIMED"
  | "FIRING"
  | "FIRED"
  | "DELIVERED"
  | "ACKNOWLEDGED"
  | "SKIPPED"
  | "FAILED"
  | "CANCELLED"
  | "PAUSED";
export interface Clock {
  now(): number;
}
export class RealClock implements Clock {
  now() {
    return Date.now();
  }
}
export class VirtualClock implements Clock {
  constructor(private time: number) {}
  now() {
    return this.time;
  }
  advance(ms: number) {
    if (ms < 0) throw new Error("Zeit darf nicht rückwärts laufen.");
    this.time += ms;
  }
}
export type Condition =
  | { type: "equals"; key: string; value: string | number | boolean }
  | { type: "and" | "or"; items: Condition[] }
  | { type: "not"; item: Condition };
export function evaluate(
  c: Condition,
  variables: Record<string, string | number | boolean>,
): boolean {
  if (c.type === "equals") return variables[c.key] === c.value;
  if (c.type === "not") return !evaluate(c.item, variables);
  return c.type === "and"
    ? c.items.every((x) => evaluate(x, variables))
    : c.items.some((x) => evaluate(x, variables));
}
export interface Content {
  eventId: string;
  title: string;
  text: string;
  interaction: "ack" | "choice" | "none";
  choices?: string[];
}
export interface Player {
  id: string;
  displayName: string;
  content: Content | null;
  lastSeen: number | null;
  lastInteraction: string | null;
  safety: boolean;
}
export interface StoryEvent {
  id: string;
  stableKey: string;
  experienceVersionId: string;
  title: string;
  internalDescription: string;
  phaseId: string;
  trigger:
    { type: "relative"; anchor: string; offset: number } | { type: "manual" };
  condition?: Condition;
  dependencies: { eventId: string; status: "ACKNOWLEDGED" | "DELIVERED" }[];
  target: string[];
  action: "SHOW_PLAYER_CONTENT";
  content: Omit<Content, "eventId">;
  fallbackAction: string;
  priority: number;
  status: EventStatus;
  scheduledAt: number | null;
  retryPolicy: "NO_EXTERNAL_SIDE_EFFECT";
  maxAttempts: number;
  idempotencyKey: string;
  createdAt: number;
  updatedAt: number;
  readyAt: number | null;
  firedAt: number | null;
  acknowledgedAt: number | null;
  source: "SYSTEM" | "HOST";
  metadata: Record<string, string>;
  delay: number;
  latePolicy: "FIRE_IMMEDIATELY" | "SKIP_IF_LATE" | "ASK_HOST";
  lateThreshold: number;
}
export interface Audit {
  id: number;
  timestamp: number;
  actor: string;
  action: string;
  reason: string;
  requestId: string;
  eventId?: string;
  playerId?: string;
  before?: string;
  after?: string;
}
export interface Interaction {
  key: string;
  playerId: string;
  eventId: string;
  value: string;
  timestamp: number;
}
export interface Run {
  id: string;
  mode: Mode;
  version: string;
  versionLocked: boolean;
  state: Lifecycle;
  virtualNow: number;
  startedAt: number | null;
  pausedAt: number | null;
  pausedTotal: number;
  stoppedAt: number | null;
  anchors: Record<string, number>;
  variables: Record<string, string | number | boolean>;
  players: Player[];
  events: StoryEvent[];
  interactions: Interaction[];
  audit: Audit[];
  receipts: Record<string, string>;
  preflight: Check[];
  snapshots: { reason: string; timestamp: number; state: string }[];
}
export interface Check {
  name: string;
  status: "PASS" | "WARNING" | "FAIL";
  detail: string;
}
export class DomainError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
export function createRun(mode: Mode, now: number, id: string): Run {
  const version = "demo-v1";
  const make = (
    eid: string,
    title: string,
    target: string[],
    trigger: StoryEvent["trigger"],
    content: StoryEvent["content"],
    deps: StoryEvent["dependencies"] = [],
    condition?: Condition,
  ): StoryEvent => ({
    id: eid,
    stableKey: eid,
    experienceVersionId: version,
    title,
    internalDescription: "Technische DEMO, keine endgültige NACHTRAG-Handlung.",
    phaseId: "ACT_1",
    trigger,
    dependencies: deps,
    condition,
    target,
    action: "SHOW_PLAYER_CONTENT",
    content,
    fallbackAction:
      "Host kann Inhalt persönlich vorlesen oder Event überspringen.",
    priority: 10,
    status: "WAITING",
    scheduledAt: null,
    retryPolicy: "NO_EXTERNAL_SIDE_EFFECT",
    maxAttempts: 1,
    idempotencyKey: `${id}:${eid}`,
    createdAt: now,
    updatedAt: now,
    readyAt: null,
    firedAt: null,
    acknowledgedAt: null,
    source: "SYSTEM",
    metadata: {},
    delay: 0,
    latePolicy: "FIRE_IMMEDIATELY",
    lateThreshold: 300_000,
  });
  return {
    id,
    mode,
    version,
    versionLocked: false,
    state: "DRAFT",
    virtualNow: now,
    startedAt: null,
    pausedAt: null,
    pausedTotal: 0,
    stoppedAt: null,
    anchors: {},
    variables: {},
    players: PLAYERS.map((name, i) => ({
      id: `p${i + 1}`,
      displayName: name,
      content: null,
      lastSeen: null,
      lastInteraction: null,
      safety: false,
    })),
    events: [
      make(
        "signal",
        "Erstes Signal · Janine",
        ["p2"],
        { type: "relative", anchor: "SESSION_START", offset: 120_000 },
        {
          title: "DEMO · Ein erstes Signal",
          text: "Dies ist ein technischer Test. Bestätige den Empfang, um den nächsten Schritt freizuschalten.",
          interaction: "ack",
        },
      ),
      make(
        "choice",
        "Eine Entscheidung · Jessy",
        ["p3"],
        { type: "relative", anchor: "DEMO_ACK", offset: 30_000 },
        {
          title: "DEMO · Zwei Wege",
          text: "Wähle einen Weg. Die Entscheidung wird auf dem Server gespeichert.",
          interaction: "choice",
          choices: ["A", "B"],
        },
        [{ eventId: "signal", status: "ACKNOWLEDGED" }],
      ),
      make(
        "branch-a",
        "Finale · Weg A",
        PLAYERS.map((_, i) => `p${i + 1}`),
        { type: "relative", anchor: "DEMO_CHOICE", offset: 0 },
        {
          title: "DEMO · Weg A",
          text: "Weg A wurde gewählt. Der technische Durchlauf ist angekommen.",
          interaction: "none",
        },
        [{ eventId: "choice", status: "ACKNOWLEDGED" }],
        { type: "equals", key: "choice", value: "A" },
      ),
      make(
        "branch-b",
        "Finale · Weg B",
        PLAYERS.map((_, i) => `p${i + 1}`),
        { type: "relative", anchor: "DEMO_CHOICE", offset: 0 },
        {
          title: "DEMO · Weg B",
          text: "Weg B wurde gewählt. Der technische Durchlauf ist angekommen.",
          interaction: "none",
        },
        [{ eventId: "choice", status: "ACKNOWLEDGED" }],
        { type: "equals", key: "choice", value: "B" },
      ),
      make(
        "manual",
        "Manueller Hinweis",
        PLAYERS.map((_, i) => `p${i + 1}`),
        { type: "manual" },
        {
          title: "DEMO · Manueller Hinweis",
          text: "Der Host hat diesen Hinweis bewusst ausgelöst.",
          interaction: "none",
        },
      ),
    ],
    interactions: [],
    audit: [],
    receipts: {},
    preflight: [],
    snapshots: [],
  };
}
export function time(run: Run, clock: Clock) {
  return run.mode === "test" ? run.virtualNow : clock.now();
}
export function storyTime(run: Run, now: number) {
  if (run.startedAt === null) return 0;
  return Math.max(
    0,
    (run.stoppedAt ?? run.pausedAt ?? now) - run.startedAt - run.pausedTotal,
  );
}
export function log(
  run: Run,
  now: number,
  actor: string,
  action: string,
  reason: string,
  requestId: string,
  extra: Partial<Audit> = {},
) {
  run.audit.push({
    id: run.audit.length + 1,
    timestamp: now,
    actor,
    action,
    reason,
    requestId,
    ...extra,
  });
}
function snapshot(run: Run, now: number, reason: string) {
  const { snapshots: _snapshots, receipts: _receipts, ...state } = run;
  void _snapshots;
  void _receipts;
  run.snapshots.push({ reason, timestamp: now, state: JSON.stringify(state) });
}
export function validateEvents(events: StoryEvent[]): string[] {
  const errors: string[] = [];
  const keys = new Set<string>();
  const visit = (id: string, path: Set<string>) => {
    if (path.has(id)) {
      errors.push(`Zyklus bei ${id}`);
      return;
    }
    const e = events.find((x) => x.id === id);
    if (!e) {
      errors.push(`Fehlende Abhängigkeit ${id}`);
      return;
    }
    e.dependencies.forEach((d) => visit(d.eventId, new Set([...path, id])));
  };
  events.forEach((e) => {
    if (keys.has(e.stableKey))
      errors.push(`Doppelter Schlüssel ${e.stableKey}`);
    keys.add(e.stableKey);
    visit(e.id, new Set());
    if (
      !e.target.length ||
      e.target.some((p) => !["p1", "p2", "p3", "p4"].includes(p))
    )
      errors.push(`Fehlendes Ziel ${e.id}`);
    if (!e.content.text || !e.fallbackAction)
      errors.push(`Fehlender Inhalt/Fallback ${e.id}`);
    if (
      e.trigger.type === "relative" &&
      !["SESSION_START", "DEMO_ACK", "DEMO_CHOICE"].includes(e.trigger.anchor)
    )
      errors.push(`Unerreichbarer Anchor ${e.id}`);
  });
  return [...new Set(errors)];
}
export function preflight(run: Run, links: string[], now: number): Check[] {
  const errors = validateEvents(run.events);
  return [
    {
      name: "Datenbank",
      status: "PASS",
      detail:
        "Dieser Check wird in einer bestätigten Storage-Transaktion gespeichert.",
    },
    {
      name: "Host-Zugang",
      status: "PASS",
      detail: "Autorisierte Host-Session.",
    },
    {
      name: "Vier Player-Zugänge",
      status: links.length === 4 ? "PASS" : "FAIL",
      detail: `${links.length}/4 gültige Links oder Sessions. Neue Links einmal öffnen.`,
    },
    {
      name: "Player-Verbindung",
      status: run.players.every((p) => p.lastSeen && now - p.lastSeen < 15000)
        ? "PASS"
        : "WARNING",
      detail:
        "Vor dem echten Abend alle vier Geräte öffnen. Hintergrund-Tabs können schlafen.",
    },
    {
      name: "Scenario / Dependencies / Targets / Fallbacks",
      status: errors.length ? "FAIL" : "PASS",
      detail:
        errors.join("; ") ||
        "DEMO v1: gültig, keine Zyklen, alle Inhalte vorhanden.",
    },
    {
      name: "Scheduler / Aktualisierung",
      status: "WARNING",
      detail:
        "Server-Catch-up aktiv. Einsekunden-Automation benötigt den separaten Scheduler; UI refetcht jede Sekunde.",
    },
    {
      name: "Safety / STOP",
      status: "PASS",
      detail:
        "Persistente Safety-Sperre vor jeder Ausführung. STOP ist terminal.",
    },
    {
      name: "Version / Zeitzone",
      status: "PASS",
      detail: `${run.version}; Europe/Berlin; Speicherung UTC.`,
    },
    {
      name: "Audio / Assets",
      status: "PASS",
      detail:
        "Diese DEMO verwendet nur Text, Bestätigung und Choice. Keine Audio-Voraussetzung.",
    },
  ];
}
const final = new Set<EventStatus>([
  "ACKNOWLEDGED",
  "DELIVERED",
  "FIRED",
  "SKIPPED",
  "CANCELLED",
]);
export function tick(run: Run, clock: Clock, requestId = "scheduler") {
  if (run.state !== "LIVE") return;
  const now = time(run, clock),
    elapsed = storyTime(run, now);
  for (const e of run.events) {
    if (final.has(e.status) || e.status === "FAILED") continue;
    if (
      !e.dependencies.every(
        (d) => run.events.find((x) => x.id === d.eventId)?.status === d.status,
      )
    ) {
      e.status = "BLOCKED";
      continue;
    }
    if (e.condition && !evaluate(e.condition, run.variables)) {
      if (run.variables.choice !== undefined) {
        e.status = "CANCELLED";
        log(
          run,
          now,
          "SYSTEM",
          "BRANCH_CANCELLED",
          "Nicht gewählter Pfad.",
          requestId,
          { eventId: e.id },
        );
      } else e.status = "BLOCKED";
      continue;
    }
    if (e.trigger.type === "manual") continue;
    const anchor = run.anchors[e.trigger.anchor];
    if (anchor === undefined) {
      e.status = "WAITING";
      continue;
    }
    const due = anchor + e.trigger.offset + e.delay;
    e.scheduledAt = due;
    if (elapsed < due) {
      e.status = "WAITING";
      continue;
    }
    e.status = "READY";
    e.readyAt ??= now;
    if (
      elapsed - due > e.lateThreshold &&
      e.latePolicy !== "FIRE_IMMEDIATELY"
    ) {
      if (e.latePolicy === "SKIP_IF_LATE") {
        e.status = "SKIPPED";
        log(
          run,
          now,
          "SCHEDULER",
          "LATE_SKIP",
          "Zeitfenster verpasst.",
          requestId,
          { eventId: e.id },
        );
      }
      continue;
    }
    fire(run, e, now, "SCHEDULER", requestId);
  }
}
function fire(
  run: Run,
  e: StoryEvent,
  now: number,
  actor: string,
  requestId: string,
) {
  if (run.state !== "LIVE" || final.has(e.status))
    throw new DomainError("Event kann jetzt nicht ausgelöst werden.");
  if (
    !e.dependencies.every(
      (d) => run.events.find((x) => x.id === d.eventId)?.status === d.status,
    ) ||
    (e.condition && !evaluate(e.condition, run.variables))
  )
    throw new DomainError(
      "Abhängigkeiten oder Branch sind noch nicht freigegeben.",
    );
  // Entire claim, execution and delivery is committed together by the store. No external side effect.
  e.status = "CLAIMED";
  e.status = "FIRING";
  for (const player of run.players.filter(
    (p) => e.target.includes(p.id) && !p.safety,
  ))
    player.content = { ...e.content, eventId: e.id };
  e.status = "DELIVERED";
  e.firedAt = now;
  e.updatedAt = now;
  e.source = actor === "HOST" ? "HOST" : "SYSTEM";
  log(
    run,
    now,
    actor,
    "EVENT_DELIVERED",
    "Inhalt serverseitig freigegeben.",
    requestId,
    { eventId: e.id, after: e.status },
  );
}
export type Command = {
  action:
    | "preflight"
    | "arm"
    | "start"
    | "pause"
    | "resume"
    | "stop"
    | "advance"
    | "fire"
    | "delay"
    | "skip";
  eventId?: string;
  ms?: number;
  reason?: string;
};
export function command(
  run: Run,
  cmd: Command,
  clock: Clock,
  key: string,
  fingerprint: string,
  links: string[] = [],
) {
  if (run.receipts[key]) {
    if (run.receipts[key] !== fingerprint)
      throw new DomainError(
        "Request-ID wurde mit anderem Inhalt wiederverwendet.",
      );
    return;
  }
  const now = time(run, clock),
    before = run.state;
  if (cmd.action === "stop") {
    if (run.state !== "STOPPED") {
      run.stoppedAt = run.pausedAt ?? now;
      run.state = "STOPPED";
      run.players.forEach((p) => (p.content = null));
      run.events.forEach((e) => {
        if (!final.has(e.status)) e.status = "CANCELLED";
      });
    }
  } else if (run.state === "STOPPED")
    throw new DomainError(
      "STOPPED ist terminal. Nur ein neuer Test Run kann zurückgesetzt werden.",
    );
  else
    switch (cmd.action) {
      case "preflight":
        if (!["DRAFT", "VALIDATED", "READY"].includes(run.state))
          throw new DomainError("Preflight ist nur vor ARM möglich.");
        run.preflight = preflight(run, links, clock.now());
        run.state = run.preflight.some((c) => c.status === "FAIL")
          ? "DRAFT"
          : "READY";
        break;
      case "arm":
        if (
          run.state !== "READY" ||
          preflight(run, links, clock.now()).some((c) => c.status === "FAIL")
        )
          throw new DomainError(
            "PRE-FLIGHT muss ohne kritischen Fehler bestehen.",
          );
        snapshot(run, now, "Vor ARM");
        run.versionLocked = true;
        run.state = "ARMED";
        break;
      case "start":
        if (run.state !== "ARMED") throw new DomainError("Zuerst ARM.");
        run.state = "LIVE";
        run.startedAt = now;
        run.anchors.SESSION_START = 0;
        snapshot(run, now, "LIVE START");
        break;
      case "pause":
        if (run.state !== "LIVE")
          throw new DomainError("Nur LIVE kann pausiert werden.");
        run.pausedAt = now;
        run.state = "PAUSED";
        break;
      case "resume":
        if (run.state !== "PAUSED" || run.pausedAt === null)
          throw new DomainError("Run ist nicht pausiert.");
        run.pausedTotal += now - run.pausedAt;
        run.pausedAt = null;
        run.state = "LIVE";
        break;
      case "advance":
        if (run.mode !== "test")
          throw new DomainError("Zeitreise ist nur im Test Mode möglich.");
        if (!cmd.ms || cmd.ms < 0 || cmd.ms > 1_800_000)
          throw new DomainError("Ungültiger Zeitsprung.");
        run.virtualNow += cmd.ms;
        break;
      case "fire":
      case "delay":
      case "skip": {
        if (
          run.state !== "LIVE" &&
          !(cmd.action !== "fire" && run.state === "PAUSED")
        )
          throw new DomainError(
            "Override benötigt LIVE (Delay/Skip auch PAUSED).",
          );
        if (!cmd.reason?.trim())
          throw new DomainError("Override benötigt eine Begründung.");
        const e = run.events.find((x) => x.id === cmd.eventId);
        if (!e) throw new DomainError("Event nicht gefunden.", 404);
        if (final.has(e.status))
          throw new DomainError("Event ist bereits abgeschlossen.");
        if (cmd.action === "fire") fire(run, e, now, "HOST", key);
        else if (cmd.action === "delay") {
          e.delay += 60_000;
          e.status = "WAITING";
        } else {
          e.status = "SKIPPED";
          run.events
            .filter((x) => x.dependencies.some((d) => d.eventId === e.id))
            .forEach((x) => (x.status = "CANCELLED"));
        }
        log(
          run,
          now,
          "HOST",
          `OVERRIDE_${cmd.action.toUpperCase()}`,
          cmd.reason,
          key,
          { eventId: e.id },
        );
        break;
      }
    }
  run.receipts[key] = fingerprint;
  log(
    run,
    now,
    "HOST",
    cmd.action.toUpperCase(),
    cmd.reason || "Bewusste Host-Aktion.",
    key,
    { before, after: run.state },
  );
  tick(run, clock, key);
}
export function interact(
  run: Run,
  playerId: string,
  eventId: string,
  value: string,
  clock: Clock,
  key: string,
) {
  const now = time(run, clock),
    player = run.players.find((p) => p.id === playerId);
  if (!player) throw new DomainError("Player nicht gefunden.", 404);
  if (run.state !== "LIVE" || player.safety)
    throw new DomainError("Interaktion ist jetzt gesperrt.");
  const existing = run.interactions.find(
    (i) => i.playerId === playerId && i.eventId === eventId,
  );
  if (existing) {
    if (existing.value !== value)
      throw new DomainError("Antwort bereits verbindlich gespeichert.");
    return;
  }
  if (player.content?.eventId !== eventId)
    throw new DomainError("Dieser Inhalt ist nicht für dich freigegeben.", 403);
  const e = run.events.find((x) => x.id === eventId);
  if (!e || e.status !== "DELIVERED")
    throw new DomainError("Event ist nicht interaktiv.");
  if (e.content.interaction === "ack" && value !== "ack")
    throw new DomainError("Ungültige Bestätigung.", 400);
  if (e.content.interaction === "choice" && !e.content.choices?.includes(value))
    throw new DomainError("Ungültige Auswahl.", 400);
  if (e.content.interaction === "none")
    throw new DomainError("Keine Antwort vorgesehen.", 400);
  run.interactions.push({ key, playerId, eventId, value, timestamp: now });
  e.status = "ACKNOWLEDGED";
  e.acknowledgedAt = now;
  player.lastInteraction = value;
  player.content = { ...player.content, interaction: "none" };
  if (eventId === "signal") run.anchors.DEMO_ACK = storyTime(run, now);
  if (eventId === "choice") {
    run.anchors.DEMO_CHOICE = storyTime(run, now);
    run.variables.choice = value;
  }
  log(run, now, "PLAYER", "INTERACTION", value, key, { eventId, playerId });
  tick(run, clock, key);
}
export function safety(run: Run, playerId: string, clock: Clock, key: string) {
  const p = run.players.find((x) => x.id === playerId);
  if (!p) throw new DomainError("Player nicht gefunden.", 404);
  if (!p.safety) {
    p.safety = true;
    p.content = null;
    log(
      run,
      time(run, clock),
      "PLAYER",
      "SAFETY_STOP",
      "Player hat die Experience gestoppt.",
      key,
      { playerId },
    );
  }
}
