# NACHTRAG Control — ARCHITECTURE

Milestone 1: Next.js App Router, React, strict TypeScript, Zod. React-freie Domain-Engine. SQLite/WAL als persistenter lokaler Adapter; PostgreSQL als Produktionsadapter. Beide serialisieren Commands atomar pro Aggregate. Server ist autoritativ. Ein separater Scheduler-Prozess prüft jede Sekunde; ein geschützter HTTP-Tick ermöglicht externen Catch-up. Browser refetcht jede Sekunde und nach Reconnect. Kein angebliches WebSocket-Realtime. Vercel benötigt PostgreSQL und einen externen Scheduler; lokale SQLite-Dateien sind dort nicht dauerhaft.

## Vollständige zugeordnete Produktanforderungen

# 8. TECHNISCHE ARCHITEKTUR

Wähle eine aktuelle, wartbare, produktionsfähige Web-Architektur.

Bevorzugte Richtung, sofern keine starke technische Begründung dagegen spricht:

- Next.js mit App Router
- React
- TypeScript strict
- Tailwind CSS
- shadcn/ui oder vergleichbar hochwertige accessible primitives
- Zod
- PostgreSQL
- Supabase für PostgreSQL + Realtime, sofern passend
- serverseitige APIs / Server Actions für sicherheitsrelevante Änderungen
- Playwright
- Vitest oder gleichwertig
- Vercel-kompatibel

Verwende aktuelle STABILE Versionen.

Keine unnötigen experimentellen Libraries.

Keine deprecated Packages.

Keine Architektur nur deshalb kompliziert machen, weil sie technisch interessant ist.

---


# 9. EXTERNE SERVICES

Wenn für Produktion Supabase oder ein ähnlicher Service benötigt wird und noch keine Credentials vorhanden sind:

NICHT AUFHÖREN.

Baue:

1. die vollständige Abstraktion,
2. Schema und Migrationen,
3. lokalen/testbaren Adapter,
4. die produktive Integration,
5. `.env.example`,
6. Setup-Dokumentation.

Der gesamte Domain-Kern und möglichst viele Tests müssen auch ohne meine externen Zugangsdaten ausführbar sein.

Kennzeichne exakt, was wegen fehlender Credentials nicht real über mehrere Geräte getestet werden konnte.

Keine Fake-Erfolgsmeldungen.

---


# 10. DOMAIN ENGINE MUSS UNABHÄNGIG VON REACT SEIN

Die Story Engine ist das wichtigste technische Element.

Implementiere sie als klar getrennte Domain-Schicht.

Die Engine darf nicht von React-Komponenten abhängen.

Sie soll möglichst deterministisch testbar sein.

Beispielhafte Domain-Module:

- StoryState
- EventDefinition
- EventExecution
- Trigger
- Condition
- Dependency
- Anchor
- TimelineClock
- Scheduler
- SafetyState
- ExperienceVersion
- Snapshot
- PlayerInteraction

Keine Businesslogik in UI-Komponenten verteilen.

---


# 19. MULTI-HOST / MULTI-TAB ROBUSTHEIT

Es kann passieren, dass Host Control auf mehreren Geräten oder Tabs geöffnet wird.

Die Engine darf dadurch keine Events doppelt auslösen.

Server ist Source of Truth.

UI ist Client, nicht Autorität.

---


# 24. PLAYER MODELL

Demo-Spielerinnen:

Reena
Janine
Jessy
Melle

Pro Player mindestens:

id

display_name

secure_link_state

token_hash

token_created_at

token_revoked_at

current_phase

current_content

last_interaction

last_seen

safety_state

metadata

Keine unnötigen personenbezogenen Daten.

---


# 34. SCHEDULER

Timed Events dürfen nicht ausschließlich davon abhängen, dass irgendein Browser-Tab aktiv ist.

Entwerfe eine robuste Scheduler-Strategie.

Wenn der gewählte Deployment-Stack subminütige serverseitige Jobs nicht zuverlässig unterstützt:

Implementiere transparent eine Hybridstrategie:

- Server ist autoritative Event-Claim-Instanz
- aktiver Live Host kann hochpräzise Due-Checks anstoßen
- serverseitiger Catch-up-Scheduler verhindert verlorene Events
- beim Reconnect werden überfällige Events geprüft

Dokumentiere reale Timing-Grenzen.

Keine Behauptung von Sekundengenauigkeit, wenn Infrastruktur das nicht garantiert.

---


# 49. EXPERIENCE VERSIONING

Sehr wichtig.

DRAFT VERSION

↓

VALIDATE

↓

PUBLISH VERSION

↓

ARM VERSION N

↓

LIVE verwendet unveränderlich VERSION N

Bearbeitungen währenddessen dürfen nicht unbemerkt die laufende Experience verändern.

Neue Änderungen erzeugen neue Draft-Version.

Live-Run referenziert exakt eine Version.

---


# 58. PLAYER PRESENCE

Host darf sehen:

Online

Offline

last seen

aktuelle Interaction

Aber:

Keine permanente GPS-Ortung.

Keine invasive Gerätedatensammlung.

---


# 59. CONNECTIVITY

Zeige Host:

SERVER

DATABASE

REALTIME

SCHEDULER

PLAYER CONNECTIONS

Nicht permanent riesig.

Bei Fehlern prominent.

---


# 62. SERVICE WORKER / PWA

Wenn PWA sinnvoll:

- installierbar
- Manifest
- Icons vorbereitet
- grundlegende statische Offlinefähigkeit

Aber:

Keine PWA-Architektur bauen, die mehr Risiken als Nutzen bringt.

Live-State bleibt serverauthoritativ.

---


# 63. WEB PUSH

Web Push darf als optionaler Adapter vorbereitet werden.

NICHT als Voraussetzung für den Core.

Insbesondere auf iOS benötigt Push Bedingungen wie installierte PWA und Permission.

Dokumentiere das realistisch.

Der Kern darf NICHT davon abhängen.

---


# 64. ASSETS

Asset Management mindestens für:

Images

Audio

Video links/files

Documents

Assets besitzen:

id

name

type

url/storage ref

size

availability

used_by_events

Preflight prüft referenzierte Assets.

---


# 66. DISPLAY VIEW

Separate Display URL.

Beispiele:

/display/<token>

Kann genutzt werden auf:

TV

Tablet

Laptop

Projektor

Display erhält ausschließlich freigegebene Story-Inhalte.

Keine Host-Steuerung sichtbar.

---


# 67. DISPLAY PAIRING

Display Token:

sicher

widerrufbar

rotierbar

Optional leichtes Pairing via Code/QR.

---


# 69. IMPORT / EXPORT

Scenario Export:

JSON

Mit:

schema_version

experience metadata

phases

events

conditions

dependencies

story variables

content

asset references

Import:

Zod validieren

Migration bei alten Schema-Versionen vorbereiten

Fehler präzise anzeigen

---


# 70. BACKUP

Scenario Export als manueller Backup-Weg.

Zusätzlich klare Dokumentation zu DB Backup.

---


# 83. DATABASE MODELL

Entwirf mindestens Tabellen / Collections für:

experiences

experience_versions

experience_runs

story_phases

players

player_access_tokens

player_sessions

story_variables

anchors

events

event_dependencies

event_conditions

event_executions

player_interactions

content_blocks

assets

safety_events

snapshots

audit_logs

system_logs

display_sessions

Passe Modell sinnvoll an, wenn bessere Normalisierung nötig ist.

Migrationen erstellen.

---


# 84. CONSTRAINTS

Nutze DB Constraints für wichtige Invarianten.

Beispiele:

unique stable event keys per version

unique idempotency key

valid foreign keys

one active live run, wenn Produktlogik das verlangt

---


# 85. REALTIME

Realtime Signale sind Hinweise auf neue Daten.

Persistente DB ist autoritative Wahrheit.

Ein verlorenes WebSocket-Signal darf State nicht dauerhaft verlieren.

Nach Reconnect:

authoritative state refetch.

---


# 86. SERVER TRANSACTIONS

Kritische State Transitions atomar ausführen.

Beispiel:

Player Interaction speichern

UND

abhängiges Event READY setzen

soll nicht halb passieren.

---


# 87. OBSERVABILITY

Developer Logs:

structured logs

request correlation IDs

event execution IDs

Keine Tokens oder Secrets loggen.

Live UI zeigt nur menschlich verständliche Fehler.

---


# 88. ERROR BOUNDARIES

Client UI darf nicht komplett abstürzen wegen einer fehlerhaften Story-Komponente.

Nutze sinnvolle Error Boundaries.

---


# 105. README

Erstelle verständliche README.

Bereiche:

Was ist NACHTRAG Control?

Architektur

Lokales Setup

Environment Variables

Database Setup

Migrationen

Start

Tests

Build

Production Setup

Player Links

Host Access

Test Mode

Preflight

ARM

LIVE

Pause / Resume

STOP ALL

Recovery

Backups

Troubleshooting

---


# 107. ARCHITECTURE DOC

Erstelle:

docs/ARCHITECTURE.md

Mit:

Domain

Data Flow

Event Engine

Scheduler

Realtime

Security

Deployment

Recovery

---


# 108. SCENARIO FORMAT

Dokumentiere Scenario Export Schema.

---


# 109. ENVIRONMENT VARIABLES

`.env.example`

Keine echten Secrets.

Jede Variable kommentieren.

---


# 110. SEED

Demo Seed Script.

Idempotent.

Mehrfach ausführen darf nicht ständig Duplikate erzeugen.

---


# 111. DATABASE MIGRATIONS

Saubere Migrationen.

Keine Schemaänderungen ausschließlich manuell erklären.

---


# 112. DEPLOYMENT

Bereite auf unkompliziertes HTTPS Deployment vor.

Wenn Vercel am sinnvollsten:

Vercel-ready.

Aber Architektur nicht unnötig proprietär koppeln.

---


# 113. EXTERNE SETUP-SCHRITTE

Am Ende nicht schreiben:

„Configure your database accordingly.“

Sondern konkret.

Beispiel:

1. Öffne supabase.com.
2. Erstelle ein Projekt.
3. Kopiere URL.
4. Kopiere Anon Key.
5. Setze Environment Variable X.
6. Führe Migration Y aus.
7. Öffne /control/preflight.

So konkret wie möglich.

---


## Tatsächliche Implementierung in Milestone 1

Der kleine persistente Aggregate-Ledger enthält zwei separate Runs (`test`, `live`), Player-Zustände, Access-/Session-Hashes, Anchors, Variables, Eventdefinitions-/Execution-State, Interaktionen, Snapshots, Audit und Test-Archive. Domain-IDs und Request-Receipts sind innerhalb des serialisierten Runs eindeutig. Kein Client besitzt DB-Zugang. SQLite/WAL `BEGIN IMMEDIATE` und PostgreSQL `SELECT ... FOR UPDATE` sichern sämtliche Commands einschließlich STOP. PostgreSQL-Cold-Start-Migrationen sind zusätzlich per Advisory-Lock serialisiert. RLS besitzt keine Player-Policies.

Diese bewusste Normalisierungsentscheidung ersetzt in Milestone 1 die vielen noch nicht benötigten CRUD-Tabellen durch eine atomare kleine Einheit. Mit Scenario-Editor, Assets, Display und wachsendem Audit-Volumen ist eine spätere normalisierte Tabellenaufteilung sinnvoll; sie muss dieselben Sicherheits-/Transaktionsinvarianten bewahren. Das gesamte zukünftige Modell aus Abschnitt 83 bleibt Anforderung, keine Behauptung bereits vorhandener 23 Tabellen.

Native semantische Controls und `<dialog>` liefern die benötigten zugänglichen Primitives ohne zusätzliches UI-Framework. Für die kleine feste Milestone-1-Oberfläche verwendet die App eine responsive CSS-Datei. Komponenten-/Editor-Komplexität kommt erst später.
