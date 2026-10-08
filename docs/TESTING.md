# NACHTRAG Control — TESTING

Milestone-1-Gate: typecheck, lint, Domain-/Storage-Integrationstests, Playwright mit mehreren isolierten Browser-Kontexten, mobile Sichtprüfung und Production Build. Fehlende externe Produktionszugänge werden offen ausgewiesen; lokale erfolgreiche Tests sind keine Behauptung eines geprüften Deployments.

## Vollständige zugeordnete Produktanforderungen

# 54. TEST MODE

Test Mode muss sich klar von Live unterscheiden.

Testdaten dürfen niemals echte Live-Daten verändern.

Features:

- virtuelle Clock
- Zeit +1min
- +5min
- +30min
- bis nächstes Event springen
- Trigger simulieren
- Player Open simulieren
- Player Choice simulieren
- Codes simulieren
- Disconnect simulieren
- Fehler simulieren
- Event Failure simulieren
- Realtime Delay simulieren
- Safety simulieren
- STOP ALL simulieren
- State reset

---


# 55. MULTI-PLAYER SIMULATOR

Baue im Test Lab idealerweise vier kleine simulierte Player Panels:

Reena

Janine

Jessy

Melle

Damit kann ich ohne vier echte Geräte testen:

- wer welchen Screen sieht
- welche Aktion möglich ist
- was Folgeevents auslöst

Zusätzlich muss der echte Player Link weiterhin testbar sein.

---


# 56. FULL EXPERIENCE SIMULATION

Button:

SIMULATE FULL EXPERIENCE

Die Engine analysiert Scenario.

Erkenne:

- Zyklen
- Events ohne erreichbaren Trigger
- fehlende Anchors
- tote Branches
- Events nach STOP/COMPLETED
- fehlende Targets
- fehlende Assets
- widersprüchliche Conditions
- Events ohne sinnvollen Fallback
- unmögliche Zeitbedingungen

Ergebnis verständlich darstellen.

---


# 91. DEMO RESET

Ein Knopf:

RESET DEMO RUN

Nur Test Mode.

Muss zuverlässig alles für den Test Run zurücksetzen.

---


# 93. NO FAKE FEATURES

Absolut wichtig.

Kein Button ohne echte Funktion.

Kein:

TODO

Coming Soon

Placeholder Action

Fake Saving

Fake Online Status

Fake Realtime

für Core Features.

Wenn etwas noch nicht real verbunden werden kann:

klar als:

NOT CONFIGURED

anzeigen.

---


# 94. TEST STRATEGY

Unit Tests:

Clock

State Machine

Condition Evaluation

Dependency Resolution

Anchor Calculation

Pause / Resume

Late Event Policy

Idempotency

Branching

STOP ALL

Safety

Snapshot Restore

---


# 95. PROPERTY / INVARIANT TESTS

Wo sinnvoll zusätzliche Invarianten testen:

Nach STOP ALL kann kein normales Event FIRED werden.

ACKNOWLEDGED Event wird nicht erneut automatisch ausgelöst.

Eine Event Execution hat höchstens einen finalen Erfolg.

Paused Story Time läuft nicht weiter.

Player kann keine Inhalte anderer Player abrufen.

---


# 96. INTEGRATION TESTS

Mindestens:

Player action
→ DB
→ trigger evaluation
→ event ready
→ execution
→ state update

Host override

Pause / Resume

Safety Stop

Reconnect

Version Lock

---


# 97. E2E TESTS

Playwright.

Mindestens:

Host login/access

Preflight

ARM

LIVE

Player Link

Player Interaction

Dependent Event

Pause

Resume

Manual Override

STOP ALL

Test Reset

Mobile viewport.

---


# 98. MULTI-CONTEXT E2E

Wenn möglich mit mehreren Browser Contexts:

Host

Player Janine

Player Jessy

Damit echten Realtime-Flow simulieren.

---


# 99. NETWORK TESTS

Simuliere zumindest:

Reload

temporären Offline-Zustand

langsame Antwort

doppelten Submit

Player reload nach acknowledgement

---


# 100. BUILD QUALITY GATE

Bevor du „fertig“ meldest, selbst ausführen:

install

typecheck

lint

unit tests

integration tests

E2E soweit Umgebung zulässt

production build

Behebe Fehler.

Nicht nur sagen, welche Befehle ich ausführen soll.

---


# 119. DEFINITION OF DONE – QUALITY

Zusätzlich:

Production Build erfolgreich.

Typecheck erfolgreich.

Lint erfolgreich.

Core Tests erfolgreich.

Keine offensichtlichen Security Leaks.

Mobile UI funktional.

README vorhanden.

Quickstart vorhanden.

Keine Core TODOs.

---

