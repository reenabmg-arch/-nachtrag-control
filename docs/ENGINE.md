# NACHTRAG Control — ENGINE

Milestone 1 implementiert einen versionierten DEMO-Run mit RealClock/VirtualClock, PRE-FLIGHT, ARM, LIVE, PAUSE/RESUME, Anchors, Bestätigung, Choice-Branch, Override (fire/delay/skip), Safety, STOP und Test Reset. Alle Commands werden innerhalb einer Storage-Transaktion ausgewertet. STOP ist terminal; Reset erstellt eine neue Test-Generation. Live und Test sind getrennte Runs.

## Vollständige zugeordnete Produktanforderungen

# 11. CLOCK ABSTRACTION

Die Engine darf nicht überall direkt `Date.now()` benutzen.

Implementiere eine abstrahierte Clock.

Mindestens:

REAL CLOCK
für Live-Betrieb.

VIRTUAL CLOCK
für Simulation und Test Mode.

Dadurch muss es möglich sein:

- Zeit vorzuspulen
- Zeit einzufrieren
- relative Events deterministisch zu testen
- einen ganzen Abend in Minuten zu simulieren

Alle persistierten Serverzeiten intern in UTC.

Darstellung lokal passend.

Standard-Timezone darf Europe/Berlin sein, aber konfigurierbar.

---


# 12. EXPERIENCE LIFECYCLE

Implementiere explizite Experience-States:

DRAFT

VALIDATED

READY

ARMED

PRE_GAME

LIVE

PAUSED

FALSE_ENDING

REACTIVATING

FINAL_ACT

STOPPED

COMPLETED

ARCHIVED

Nicht jeder Zustand muss im ersten UI gleich prominent sein, aber die Domain muss sauber darauf vorbereitet sein.

Ungültige Zustandswechsel müssen verhindert werden.

Beispiel:

DRAFT → LIVE

darf nicht einfach möglich sein.

---


# 15. ANCHOR POINTS

Events dürfen NICHT nur an festen Uhrzeiten hängen.

Unterstütze Anchor Points.

Beispiele:

SESSION_START

ALL_PRESENT

FIRST_SIGNAL

ACT_1_START

DISCOVERY

ESCALATION_START

FALSE_ENDING

REACTIVATION

FINAL_REVEAL

Ein Event kann z. B. lauten:

Anchor:
FIRST_SIGNAL

Offset:
+12 Minuten

Anchor Points können:

- automatisch
- manuell
- durch Player-Aktion
- durch anderes Event

gesetzt werden.

---


# 16. EVENTS

Jedes Event benötigt mindestens:

id

stable_key

experience_version_id

title

internal_description

phase_id

trigger_definition

conditions

dependencies

target

action

fallback_action

priority

status

scheduled_at

anchor_id

offset

retry_policy

max_attempts

idempotency_key

created_at

updated_at

ready_at

fired_at

acknowledged_at

source

metadata

Verwende ein sauberes typisiertes Modell.

---


# 17. EVENT STATUS

Mindestens:

BLOCKED

WAITING

READY

CLAIMED

FIRING

FIRED

DELIVERED

ACKNOWLEDGED

SKIPPED

FAILED

CANCELLED

PAUSED

Nicht jeden technischen Status zwangsläufig prominent anzeigen, aber Engine und Audit Log sollen ihn kennen.

---


# 18. IDEMPOTENZ

Extrem wichtig.

Dasselbe Event darf nicht versehentlich mehrfach ausgeführt werden durch:

- Reconnect
- Browser Reload
- mehrere Host-Tabs
- doppelten API Request
- Retry
- Realtime-Wiederholung
- Netzwerk-Timeout
- Scheduler-Race

Implementiere:

- eindeutige idempotency keys
- serverseitige atomare Claims / Locks
- Transaktionen, wo nötig
- unique constraints, wo sinnvoll

Ein HTTP-Timeout darf NICHT automatisch bedeuten, dass ein Event erneut ungeprüft ausgeführt wird.

---


# 20. TRIGGER ENGINE

Unterstütze mindestens:

MANUAL

ABSOLUTE_TIME

RELATIVE_TIME

PLAYER_OPENED

PLAYER_ACKNOWLEDGED

PLAYER_BUTTON

PLAYER_CHOICE

PLAYER_TEXT_INPUT

PLAYER_CODE_INPUT

EVENT_STATUS

ANCHOR_CREATED

PHASE_ENTERED

CONDITION_SET

COMPOSITE

Composite Conditions:

AND

OR

NOT

Wenn sinnvoll, verschachtelbar.

---


# 21. EVENT DEPENDENCIES

Events können von mehreren Events abhängen.

Unterstütze z. B.:

ALL OF

ANY OF

SUCCESS OF

ACKNOWLEDGED OF

FIRED OF

SKIPPED OR FIRED

Die Engine muss erkennen können:

- Zyklen
- unerreichbare Events
- tote Dependencies

---


# 22. EVENT ACTION TYPES

Erstelle eine erweiterbare Action-Architektur.

Mindestens vorbereiten:

SHOW_PLAYER_CONTENT

SHOW_DISPLAY_CONTENT

SET_PHASE

CREATE_ANCHOR

UNLOCK_CONTENT

REQUEST_ACKNOWLEDGEMENT

SET_VARIABLE

BRANCH

START_COUNTDOWN

END_COUNTDOWN

BLACKOUT_PLAYER

CLEAR_PLAYER_VIEW

LOG_ONLY

MANUAL_INSTRUCTION

Spätere Adapter sollen möglich sein für:

- Web Push
- E-Mail
- Smart Home
- Webhook
- Audio-System
- externe APIs

Aber externe Adapter dürfen den Core nicht dominieren.

---


# 32. PAUSE / RESUME

PAUSE ist NICHT STOP.

PAUSE:

- friert Story-Automation
- friert relative Story-Zeit
- Player Safety bleibt aktiv
- Host bleibt bedienbar

Bei RESUME:

Relative Timer werden korrekt um die Pausendauer verschoben.

Beispiel:

Event noch 6 Minuten entfernt.
Pause dauert 20 Minuten.
Nach Resume Event weiterhin noch ca. 6 Minuten entfernt.

---


# 33. MASTER CLOCK

Live Control zeigt:

- echte Uhrzeit
- Session elapsed time
- Story elapsed time
- Pausendauer
- aktuelle Anchor-relative Zeit

Story Time und Wall Clock sauber unterscheiden.

---


# 35. LATE / MISSED EVENT POLICY

Definiere pro Event eine Policy für verpasste Zeitpunkte:

FIRE_IMMEDIATELY

SKIP_IF_LATE

ASK_HOST

RESCHEDULE_RELATIVE

CANCEL_BRANCH

Beispiel:

Ein atmosphärisches Ereignis, das 25 Minuten zu spät wäre, soll nicht zwingend blind nachgeholt werden.

---


# 36. FAIL-SOFT

Ein einzelnes technisches Problem darf nicht den Abend zerstören.

Wenn Event-Ausführung fehlschlägt, Host zeigt:

EVENT FAILED

Was sollte passieren?

Welche Person betrifft es?

Warum ist es vermutlich fehlgeschlagen?

Welche Ersatzaktion ist möglich?

Direkte Buttons:

RETRY

SHOW MANUALLY

COPY CONTENT

MARK DELIVERED

SKIP

BLOCK FOLLOWUPS

Kein technischer Stacktrace im Live UI.

---


# 43. STORY VARIABLES

Unterstütze typisierte Story Variables.

Beispiele:

boolean

string

number

choice

timestamp

player reference

Event Conditions dürfen Variablen verwenden.

Änderungen werden geloggt.

---


# 44. BRANCHING

Unterstütze Story Branches.

Beispiel:

Janine wählt A

→ Branch A

wählt B

→ Branch B

Nicht ausgewählte Branch-Events müssen sauber blockiert/cancelled werden.

Branch-Verhalten muss im Log nachvollziehbar sein.

---


# 50. SNAPSHOTS

Speichere Snapshots an wichtigen Punkten:

vor ARM

bei PRE_GAME START

bei LIVE START

bei Phasenwechsel

vor kritischen Events

bei FALSE ENDING

vor FINAL ACT

Snapshots enthalten mindestens:

- Experience State
- Story Variables
- Anchors
- Player State
- Event Status
- Clock State

---


# 51. RESTORE

Host kann einen Snapshot wiederherstellen.

Aber:

Im LIVE-Betrieb nur mit deutlicher Bestätigung.

Restore selbst wird geloggt.

Restore darf nicht versehentlich alte Events erneut doppelt ausführen.

Nach Restore Idempotenz beachten.

---


# 52. EVENT LOG

Human-readable Log.

Beispiel:

20:41:13
EVENT READY
„Janine – Nachricht 04“
Grund:
EVENT 19 acknowledged + 8m elapsed

20:41:14
EVENT FIRED
Target:
Janine
Mode:
automatic

20:41:21
PLAYER ACKNOWLEDGED
Janine

Nicht nur Debug JSON.

---


# 53. AUDIT / PROVENANCE

Für jede relevante Änderung speichern:

timestamp

actor

source

reason

old state

new state

related event

related player

manual / automatic

request/idempotency id

Actor kann sein:

SYSTEM

HOST

PLAYER

SCHEDULER

RECOVERY

TEST_MODE

---


# 57. DETERMINISTIC REPLAY

Wenn praktikabel:

Ermögliche einen Run anhand Event Log / Interactions logisch zu rekonstruieren.

Ziel:

Warum war System um 21:13 in Zustand X?

Nicht zwingend visuelle Video-Replay-Funktion.

Aber State-Historie nachvollziehbar.

---


# 61. PLAYER RECONNECT

Player lädt Seite neu:

aktuell erlaubter Story State erscheint wieder.

Player darf nicht zurück auf alten Screen fallen.

Bereits bestätigte Aktionen dürfen nicht erneut ausgelöst werden.

---


# 89. RETRIES

Nur bei transienten Fehlern.

Exponential Backoff + Jitter.

Keine unendlichen Retries.

Story Actions müssen Retry-Semantik definieren.

---

