# NACHTRAG Control

Privates Steuerungssystem für eine immersive Experience mit Reena, Janine, Jessy und Melle. Reena ist Host und Mitspielerin. Host Control ist Deutsch und für das iPhone ausgelegt.

**Milestone 1** enthält einen tatsächlich ausführbaren DEMO-Durchlauf. Die DEMO ist keine endgültige NACHTRAG-Handlung. Das spätere Backlog (Editor, Display, Prelude, vollständige Trigger-/Action-Bibliothek, Snapshot Restore, externe Adapter) ist in [docs/ROADMAP.md](docs/ROADMAP.md) abgegrenzt. Es gibt dafür keine wirkungslosen Buttons.

## Architektur

- Next.js App Router, React und strict TypeScript; semantisches HTML, native Dialoge und eine kleine responsive CSS-Schicht.
- React-freie Domain in `src/domain/engine.ts`: Clock, State Machine, Anchors, Dependencies, Conditions, Branches, Safety und Audit.
- `src/server/store.ts`: dauerhafte SQLite/WAL-Speicherung für lokal/einen persistenten Server; PostgreSQL für Serverless und mehrere Instanzen.
- `src/server/service.ts`: atomare Commands, einmalige Player-Links, getrennte Host-/Player-Sessions und Datenprojektionen.
- Polling: Player und Host holen jede Sekunde den autoritativen Zustand. Kein behauptetes WebSocket-Realtime.
- Separater Scheduler-Prozess: serverseitige Due-Checks ohne offenen Host-/Player-Tab. Zusätzlich Catch-up bei Zugriff und geschützter Scheduler-Endpunkt.

Die PostgreSQL-Migration liegt unter `migrations/001_control.sql`. Milestone 1 verwendet bewusst einen kleinen, transaktionalen JSONB-Aggregate-Ledger anstelle von 23 halbfertigen CRUD-Tabellen. Eine Zeilensperre serialisiert sämtliche Claims, Interaktionen, STOPs und Token-Widerrufe über mehrere Instanzen. Die SQLite-Transaktion verwendet `BEGIN IMMEDIATE`. Das Modell und die spätere Aufteilung sind in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) beschrieben.

## Lokales Setup

Voraussetzung: Node.js 24 LTS, npm, für den nativen SQLite-Adapter eine C++-Toolchain (`make`, `g++`, Python 3). PostgreSQL ist lokal optional.

```sh
npm ci
npm run setup
npm run seed
npm run dev
```

`setup` erzeugt nur dann `.env.local`, wenn die Datei fehlt. Sie erhält zwei zufällige serverseitige Secrets und Dateirechte 0600. Bestehende Einstellungen bleiben erhalten. `seed` ist idempotent und bewahrt bestehende Runs, Logs und Zugänge.

In einem zweiten Terminal:

```sh
npm run scheduler
```

Die App läuft lokal auf Port 3000. Öffne den Pfad `/control`. Den Wert `HOST_SECRET` aus deiner lokalen `.env.local` trägst du im geschützten Host-Login ein. Diese Datei wird weder committed noch in Browser-Bundles eingebettet. Kopiere das Secret nicht in Chat oder öffentliche Logs.

### In dieser Cloud-Umgebung

Die Cache-Verzeichnisse des Benutzerprofils sind nicht beschreibbar. Verwende hier:

```sh
npm_config_devdir=/workspace/.node-gyp npm ci --cache /workspace/.npm-cache
```

Node-gyp lädt verifizierte Node-Header in das beschreibbare Verzeichnis. Paketintegrität und TLS werden nicht abgeschaltet. Der vorhandene Chromium wird für Playwright genutzt; ein zusätzlicher Browser-Download ist hier nicht nötig.

## Environment Variables

Alle Variablen sind in `.env.example` kommentiert:

| Variable | Zweck |
| --- | --- |
| `HOST_SECRET` | Server-only, mindestens 32 Zeichen; zufälliger Host-Zugang. |
| `SCHEDULER_SECRET` | Server-only, mindestens 32 Zeichen; autorisiert den Worker. |
| `APP_ORIGIN` | Exakte öffentliche Origin; HTTPS in Produktion. POST-Origin muss übereinstimmen. |
| `DATABASE_URL` | Optional lokal; in Vercel zwingend erforderlich. PostgreSQL-Serverzugang, niemals `NEXT_PUBLIC_*`. |
| `SQLITE_PATH` | SQLite-Datei auf dauerhaftem Volume; Standard `.data/control.sqlite`. |
| `ALLOW_INSECURE_LOCAL` | Nur `1` bei explizitem HTTP-Loopback-Test. Auf echter HTTPS-Domain weglassen. |

Cookies sind HttpOnly, SameSite=Strict, mit Ablaufdatum und Hash-Speicherung. In Produktion sind sie Secure; die ausdrücklich aktivierte HTTP-Loopback-Testausnahme gilt nur für `localhost`/`127.0.0.1`.

## Host-Zugang und Player-Links

1. Host mit `HOST_SECRET` anmelden.
2. Im Test Run für jede Spielerin „Player-Link erzeugen“ drücken.
3. Den persönlichen Link teilen oder in einem **separaten Browserprofil** öffnen. Jede Spielerin benötigt ihre eigene Session; Reena hat zusätzlich die separate Host-Session.
4. Der Token steht im URL-Fragment, erreicht keine HTTP-URL/Access-Logs und wird vor dem Exchange aus der aktuellen URL entfernt. Nur sein SHA-256-Hash wird gespeichert.
5. Der einmalige Exchange führt zu `/p` ohne Token. Ein verbrauchter Link funktioniert nicht erneut. Reload funktioniert über die Session.
6. „Link neu erzeugen“ oder „Widerrufen“ invalidiert den alten Link und alle dazugehörigen Sessions.

Ein kopierter Link ist ein Zugangsschlüssel. Nicht öffentlich teilen. Link-Werte sind ausschließlich nach ihrer Erzeugung in der aktuellen Host-Ansicht sichtbar; sie können nicht später aus der Datenbank ausgelesen werden.

## Test Mode, PRE-FLIGHT, ARM und LIVE

[Reenas kurze Anleitung](docs/REENA-QUICKSTART.md) erklärt den Ablauf ohne Fachsprache.

- Test und Live sind **getrennte persistente Runs**. Ein Test Reset verändert keine Live-Daten.
- PRE-FLIGHT prüft vier Zugänge, Host-Auth, Datenbank, Scenario, Dependencies, Targets, Inhalte, Fallbacks, Safety und Version. Kritisches FAIL blockiert ARM. Scheduler und Geräteverbindung werden real geprüft bzw. als Warnung ausgewiesen; Audio ist in dieser Text-DEMO nicht nötig.
- ARM friert die DEMO-Version des Runs ein. Es kann nicht direkt von DRAFT zu LIVE gewechselt werden.
- LIVE setzt `SESSION_START`. Nach **2 Minuten Story-Zeit** erhält Janine das erste Signal.
- Bestätigung persistiert Interaktion und `DEMO_ACK` atomar. **30 Sekunden später** erhält Jessy eine Auswahl A/B. Die Auswahl liefert den jeweiligen Abschluss an alle sicheren Player; der andere Branch wird cancelled.
- Im Test Mode lässt sich die virtuelle Zeit um +1/+5/+30 Minuten vorspulen. Im Live Run gilt reale Serverzeit.
- PAUSE friert die Story Clock und Automation ein. RESUME zieht die Pausendauer korrekt ab; Safety bleibt auch während der Pause verfügbar.

## Manual Override und STOP ALL

Event-Zeilen ermöglichen **Auslösen**, **+1 Minute** und **Überspringen**, jeweils mit protokollierter Begründung. Auslösen prüft weiterhin Safety, Dependencies und Branch-Freigaben. Bereits ausgeführte Events können nicht erneut feuern. Überspringen cancelt direkte Folgeevents; spätere abhängige Events bleiben gesperrt.

STOP ALL ist immer in der unteren Leiste erreichbar und braucht eine zweite bewusste Bestätigung. Es ist kein Pause-Ersatz: STOPPED ist terminal, alle Player werden neutral, spätere Worker und Retries können nichts mehr freigeben. Auch während eines anderen laufenden Host-Requests bleibt STOP erreichbar. Bei Netzverlust kann kein Web-System einen entfernten Stop garantieren: die UI bestätigt keinen Erfolg und fordert eine direkte persönliche Unterbrechung.

Player haben unabhängig davon „EXPERIENCE STOPPEN“. Das setzt eine persistente persönliche Safety-Sperre, entfernt Inhalt und meldet den Vorfall beim Host. Andere Player werden dadurch nicht automatisch gestoppt; Reena kann jederzeit global STOP ALL wählen.

## Event Log und Recovery

Das Event Log zeigt die letzten 150 Einträge des aktuellen Runs mit Actor, Grund, Event/Player und Zustandswechsel. Die Datenbank behält das vollständige Log sowie archivierte Test Runs. Alle Zeitwerte sind UTC-Epoch-Millisekunden; Anzeige in Europe/Berlin.

Reload/Reconnect holen den aktuellen autoritativen Zustand. Bereits bestätigte Antworten werden nicht erneut ausgelöst. Host-Commands besitzen Request-IDs mit Payload-Fingerprint; Wiederholung desselben Commands wirkt einmal, Wiederverwendung derselben ID für andere Daten wird abgelehnt. Player-Antworten sind zusätzlich pro Run/Player/Event eindeutig. Externe Side-Effects sind in dieser DEMO nicht vorhanden; deren Outbox-/Retry-Semantik gehört zum späteren Adapter-Milestone.

Vor ARM und bei LIVE START werden Snapshots gespeichert. Eine Restore-UI ist erst Teil des Recovery-Milestones; hier gibt es keinen Fake-Restore-Button. Ein gestoppter Live Run wird nicht per Reset reaktiviert. Neue Live Runs und Scenario-Bearbeitung folgen mit dem nächsten Lifecycle-Milestone.

## Tests und Build

```sh
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Playwright startet den **Production Server** und den separaten Worker selbst, mit isolierter SQLite-Datei und ausschließlich E2E-Credentials. Es testet mehrere Browser-Kontexte bei 393×852, Auth, Link-Exchange, Preflight, ARM, LIVE, Automation, Interaktion, Folgeevent/Branch, Pause/Resume, Override, STOP, Audit, Reset, Reconnect, Duplikate, Revocation und den Real-Clock-Scheduler ohne offenen Browser. Der Echtzeit-Test dauert absichtlich gut zwei Minuten.

Wenn kein System-Chromium vorhanden ist, vorher `npx playwright install --with-deps chromium` ausführen. Alternativ `PLAYWRIGHT_EXECUTABLE_PATH` auf einen vorhandenen Chromium setzen. `--no-sandbox` gilt ausschließlich für den Browser-Test in isolierten CI-Containern; normale Player-Geräte nutzen ihre Browser-Sandbox.

## Production Setup

### Persistenter Node-Server (kleinster vollständiger Betriebsweg)

1. Node.js 24, Build-Toolchain und das Repository auf einem persistenten Server bereitstellen.
2. `npm ci`, `npm run setup` und `npm run build` ausführen.
3. `HOST_SECRET` und `SCHEDULER_SECRET` sicher setzen; `APP_ORIGIN` auf die echte HTTPS-Domain setzen. `ALLOW_INSECURE_LOCAL` entfernen.
4. `.data/` auf einem dauerhaften Volume halten oder `DATABASE_URL` setzen.
5. `npm run start` und `npm run scheduler` als **zwei überwachte Prozesse** starten. Worker erst starten, wenn `/api/health` erfolgreich antwortet. Prozessneustarts automatisieren.
6. Einen HTTPS-Reverse-Proxy vor Port 3000 setzen. Request-/Body-/Cookie-Logging für Auth und APIs deaktivieren. URL-Fragmente werden ohnehin nicht übertragen.
7. Host öffnen, vier Testzugänge auf echten Geräten öffnen, PRE-FLIGHT und DEMO durchführen. Safety und iPhone/Safari separat prüfen, bevor eine echte Experience beginnt.

### PostgreSQL / Supabase / Vercel

1. Bei Supabase ein PostgreSQL-Projekt erstellen (oder eine eigene PostgreSQL-Instanz verwenden).
2. In den Projekt-Einstellungen den **serverseitigen PostgreSQL-Verbindungsstring** kopieren. Das ist nicht der Anon-Key. Bei Vercel eine geeignete Session-/Transaction-Pooler-Verbindung wählen, wenn direkte IPv6-Erreichbarkeit fehlt.
3. Diesen Wert als `DATABASE_URL` in den Deployment-Environment-Settings eintragen. Keine Werte in Git oder Chat veröffentlichen. TLS mit vertrauenswürdigem CA-Zertifikat verwenden; `rejectUnauthorized=false` ist kein erlaubter Workaround.
4. `HOST_SECRET`, `SCHEDULER_SECRET` und die exakte HTTPS-`APP_ORIGIN` ebenfalls setzen; `ALLOW_INSECURE_LOCAL` nicht setzen.
5. Die Migration wird vom Server beim ersten Datenzugriff idempotent ausgeführt. Alternativ `migrations/001_control.sql` vorab im SQL-Editor ausführen und `npm run seed` mit gesetzter Verbindung ausführen. Die Anwendung nutzt den serverseitigen Table-Owner-Zugang. RLS hat keine Player-Policies; Browser erhalten keinen direkten Datenbankzugang.
6. Repository in Vercel importieren, Framework Next.js, Build `npm run build`, deployen. SQLite ist auf Vercel ausdrücklich gesperrt, wenn `DATABASE_URL` fehlt.
7. Auf einem ständig laufenden Worker-Host `npm run scheduler` mit der öffentlichen `APP_ORIGIN` und dem identischen `SCHEDULER_SECRET` betreiben. Für gröberen Catch-up kann ein externer Scheduler `GET /api/scheduler` mit `Authorization: Bearer <SCHEDULER_SECRET>` aufrufen.
8. Ohne permanenten Worker hängen Timing-Grenzen vom externen Jobintervall und von Refetches ab. **Vercel Cron allein garantiert keine subminütige Ausführung.** Kein Live-Betrieb mit Timing-Erwartungen, die die Infrastruktur nicht erfüllt.
9. Auf der echten Domain einen vollständigen Test Run mit vier Geräten durchführen. Ein erfolgreiches lokales Build ist kein Nachweis eines veröffentlichten Deployments.

## Backups

SQLite: während die eigenen App-/Worker-Prozesse gestoppt sind `.data/control.sqlite` sichern; bei laufendem Betrieb eine SQLite-Backup-API statt bloßem Dateikopieren verwenden (WAL beachten). Secrets getrennt sichern. Für Restore App und Worker stoppen, die gesicherte Datei an denselben Pfad legen, Dateirechte prüfen und beide Prozesse neu starten; anschließend zuerst Test/Preflight prüfen. Nicht versehentlich einen alten Live-Zustand reaktivieren.

PostgreSQL: regelmäßige providerseitige Backups/PITR aktivieren und Restore in einer separaten Datenbank testen. Die Tabelle `control_state` enthält Runs, Interaktionen, Token-Hashes, Sessions und Audit-Historie. Keine öffentliche Freigabe. Scenario-JSON-Export/Import ist im Editor-Milestone vorgesehen, derzeit kein verfügbarer Backup-Button.

## Troubleshooting

| Problem | Konkrete Aktion |
| --- | --- |
| Host nicht konfiguriert | `npm run setup`; in bestehenden Settings ein zufälliges `HOST_SECRET` mit mindestens 32 Zeichen setzen, Server neu starten. |
| PRE-FLIGHT FAIL | Fehlende Player-Zugänge erzeugen; die echte Ursache im Check beheben, erneut PRE-FLIGHT ausführen. |
| Link verbraucht | Im Host für genau diese Spielerin einen neuen Link erzeugen; die alte Session wird widerrufen. |
| Zugriff von fremder Seite blockiert | `APP_ORIGIN` muss mit der tatsächlich geöffneten Origin exakt übereinstimmen (inklusive Port, ohne abschließenden Slash). |
| Scheduler nicht bestätigt | Zweiten Prozess `npm run scheduler` starten; identische Origin und Scheduler-Credential prüfen. |
| Server nicht erreichbar | UI zeigt letzten Stand und keinen Fake-Erfolg. Netz reparieren; danach Reload/Refetch. Safety persönlich kommunizieren. |
| Daten nach Deployment verschwinden | Serverless benötigt PostgreSQL; SQLite benötigt ein dauerhaftes Volume. |
| Native Installation scheitert | Node 24, Python/make/g++ und beschreibbare npm-/node-gyp-Caches prüfen. Nicht Signatur-/TLS-Prüfungen deaktivieren. |
| STOPPED | Terminal. Nur den Test Run mit Test Reset erneuern; Live-Reaktivierung ist kein erlaubter Shortcut. |

## Produktunterlagen

Die acht verlangten Arbeitsdokumente enthalten **alle 122 Originalanforderungen**, nach Themen verteilt. [AGENTS.md](AGENTS.md) ist die kurze Navigationskarte. [docs/VALIDATION.md](docs/VALIDATION.md) enthält ausgeführte Prüfungen und ausdrücklich offene Grenzen.

### PostgreSQL-Tests

Die optionalen PostgreSQL-Integrationstests laufen nur mit `PG_TEST_URL` gegen die separate Wegwerf-Datenbank `nachtrag_test`. Ohne diese Einstellung meldet Vitest vier ausdrücklich übersprungene PostgreSQL-Fälle. Der lokale SQLite-/Domain-Kern bleibt vollständig testbar. Eine zusätzliche HTTP-E2E-Prüfung kann `E2E_DATABASE_URL` zur getrennten `nachtrag_e2e`-Datenbank verwenden. Beide URLs dürfen niemals die produktive Datenbank bezeichnen. Details und Ergebnisse stehen in `docs/VALIDATION.md`.
