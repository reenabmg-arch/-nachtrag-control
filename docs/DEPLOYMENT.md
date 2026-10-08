# HTTPS-Deployment — NACHTRAG Control

Stand: 8. Oktober 2026. Der geprüfte Deployment-Weg verwendet Render: einen ständig laufenden Node-Webservice in Frankfurt, eine private PostgreSQL-Datenbank und den gemeinsam überwachten Scheduler. `render.yaml` enthält die vollständige Ressourcenkonfiguration. Render terminiert HTTPS automatisch an der bereitgestellten `onrender.com`-Adresse. Eine eigene Domain ist optional.

**Noch nicht veröffentlicht:** Hier liegt kein Render-Konto-/API-Zugang vor. Die kostenpflichtigen Ressourcen werden erst nach deiner Bestätigung bei Render erzeugt. Die aktuell angezeigten Preise sind vor „Apply“ zu prüfen; es wurde kein Abo abgeschlossen.

## Codex-Umgebung: exakte Einträge

Repository: `reenabmg-arch/-nachtrag-control`, Branch `main`, Checkout `/workspace/-nachtrag-control`, Node.js 24.

Installationsskript:

```bash
#!/usr/bin/env bash
set -euo pipefail
bash /workspace/-nachtrag-control/scripts/cloud-install.sh
```

Startanweisungen für Codex:

```text
Verwende den vorhandenen Checkout /workspace/-nachtrag-control. Keine zusätzlichen Worktrees ohne ausdrücklichen Auftrag. Lies AGENTS.md. Starte die Umgebung mit:
bash /workspace/-nachtrag-control/scripts/cloud-start.sh
Prüfe intern /api/ready und den authentifizierten Host-Zustand: vier Player, Datenbank erreichbar, Scheduler aktiv. Keine Secrets ausgeben. Keine öffentlich dargestellten localhost-Links. Bei bereits laufendem, ungesundem Server keine Doppelinstanz starten; eigene Prozesse und private Logs prüfen. Live-Daten und .env.local bewahren; keinen Test Reset beim Start ausführen.
```

Diese beiden Felder sind als Entwurf gespeichert. Speichern des Entwurfs führt keine Befehle aus und veröffentlicht keine Umgebung. Die aktuelle Maschine wurde separat tatsächlich geprüft.

Der Installationshelfer führt `npm ci`, `npm run setup`, `npm run seed` und `npm run build` aus, mit beschreibbaren Cloud-Caches. Bestehende Zugangsdaten und Runs bleiben erhalten. Der Starthelfer startet `npm run start:managed` und wartet auf Datenbank-/Worker-Readiness. Er lässt eine schon gesunde Instanz bestehen. Ein vorhandener ungesunder Server wird nicht blind beendet oder dupliziert.

### Auf dem iPhone speichern/veröffentlichen

1. In Codex die Umgebung für dieses Repository und deren Umgebungseinstellungen öffnen.
2. Die gespeicherten Installations-/Startanweisungen prüfen; du musst sie nicht neu eintippen.
3. Änderungen speichern und anschließend die Umgebung veröffentlichen.
4. Den Abschluss der Veröffentlichung abwarten, bevor du eine neue Task in dieser Umgebung startest.

Die konkrete Position der Navigation und mögliche abweichende Übersetzungen der Buttons sind hier nicht sichtbar. Die bestätigte Produktfolge ist: Umgebungseinstellungen → prüfen/speichern → veröffentlichen. Die Cloud-Veröffentlichung ist getrennt vom Render-HTTPS-Deployment.

## Auf dem iPhone Render verbinden und Ressourcen bestätigen

1. In Safari `https://dashboard.render.com` öffnen. Bei fehlendem Konto registrieren, vorzugsweise mit GitHub.
2. GitHub bei Render verbinden. Wenn GitHub die Repository-Freigabe abfragt, nur `reenabmg-arch/-nachtrag-control` auswählen. Falls die Organisation eine Freigabe verlangt, diese dort bestätigen.
3. Im Render-Dashboard **New → Blueprint** wählen und dieses Repository verbinden/auswählen.
4. Branch **main**, Datei **render.yaml** verwenden. Render liest daraus Webservice, Datenbank und Start-/Buildbefehle.
5. Die zwei angezeigten Ressourcen und ihre tatsächlichen laufenden Kosten prüfen: `nachtrag-control` (Starter Webservice) und `nachtrag-db` (Basic PostgreSQL). Erst dann die Erstellung mit **Apply** bzw. dem angebotenen Bestätigungsbutton bestätigen.
6. Warten, bis der Webservice **Live** meldet. Die öffentliche HTTPS-Adresse aus dem Webservice kopieren und hier mitteilen. Keine Tokens, Passwörter oder Datenbank-URLs in den Chat kopieren.

Keine Supabase-Einrichtung, manuelle Datenbankmigration oder zusätzliche Scheduler-Plattform nötig. Wenn Render die Blueprint-Datei ablehnt, den nicht geheimen Fehlertext mitteilen; keine Ressourcen mit geratenen Ersatzwerten anlegen.

## Automatisch vorbereitete Einstellungen

- Build: `npm ci --include=dev && npm run build`.
- Start: `npm run start:managed`.
- Health Check: `/api/ready`; antwortet nur bei erreichbarer Datenbank und frischem Scheduler-Heartbeat mit 200.
- Node-Version: 24.19.0.
- `DATABASE_URL`: automatisch aus der privaten Datenbank verbunden. Keine externe DB-Allowlist.
- `HOST_SECRET` und `SCHEDULER_SECRET`: Render generiert die Werte, keine Eingabe im Chat.
- Öffentliche Origin: wird aus `RENDER_EXTERNAL_URL` übernommen. Eine später eingerichtete eigene Domain verlangt eine exakt passende HTTPS-`APP_ORIGIN`.
- Produktions-Cookies sind Secure und HttpOnly. Die lokale HTTP-Ausnahme wird nicht konfiguriert.
- App und Worker sind zwei überwachte Kindprozesse. Ein unerwartet beendeter Prozess beendet den Manager; Render kann den gesamten Service neu starten. Der Worker ruft intern den Server auf, unabhängig von mobilen Browser-Tabs.
- Migration/Seed geschehen idempotent beim ersten Serverzugriff; bestehende Runs werden nicht zurückgesetzt. Deployments kopieren keine lokalen DEMO-Daten oder `.env.local` nach Render.
- Automatische Git-Deployments sind zunächst ausgeschaltet; keine unbemerkten Änderungen während einer Experience.

## Nach der Veröffentlichung

Den Host-Zugang findest du beim Render-Webservice unter den Environment-Einstellungen als `HOST_SECRET`. Nur dort sicher anzeigen/kopieren und in der HTTPS-App `/control` eintragen, niemals hier posten. Danach vier Test-Player auf echten Geräten öffnen und den DEMO-Durchlauf einschließlich Safety prüfen. Für den echten Abend muss der Scheduler-Check bestehen.

Ich kann mit der öffentlichen URL HTTPS, Security Headers, Gesundheitscheck und öffentliche Zugangssperren prüfen. Der authentifizierte Vier-Geräte-Test braucht deine sichere Host-Session auf den tatsächlichen Geräten. Eine Cloud-Simulation ersetzt den iPhone-/Safari-Test nicht.

## Tatsächlich ausgeführte Prüfungen

- Typecheck, Lint und Production Build erfolgreich.
- 21 Unit-/SQLite-/PostgreSQL-/Deployment-Konfigurationsprüfungen bestanden (PostgreSQL explizit aktiviert).
- Beide mobilen Mehr-Kontext-E2E-Kernszenarien bestanden.
- Separater Produktionsstart-Test mit echter lokaler PostgreSQL-Datenbank: überwachte App + Worker, Origin-Ableitung, Secure/HttpOnly-Cookies, Player-Delivery, atomarer Followup, Pause/Resume und persistenter STOP bestanden.
- Cloud-Installationsskript ausgeführt; vorhandene Einstellungen/Daten bewahrt. Startskript ausgeführt und zweimal auf Readiness/Idempotenz geprüft; echter Host-Zugang, vier Player und aktiver Worker bestätigt.
- Blueprint-YAML syntaktisch geprüft; Datenbank-Verknüpfung geprüft. Render-seitige Schemaannahme, Konto-Berechtigungen, Rechnungsfreigabe und öffentliches TLS bleiben bis zur tatsächlichen Bereitstellung ungetestet.

Der lokale PostgreSQL-Start-Test ist ein echter Datenbank-/Prozesstest; er behauptet kein öffentliches TLS-Deployment. Sein reproduzierbarer Aufruf (nur isolierte Testdatenbank):

```sh
SMOKE_DATABASE_URL=postgresql://…/nachtrag_deploy_test node scripts/smoke-deployment.mjs
```
