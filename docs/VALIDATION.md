# Milestone 1 — ausgeführte Validierung

Stand: 8. Oktober 2026. Geprüft in der tatsächlichen Cloud-Maschine mit Node 24.19.0, Chromium 151 und PostgreSQL 17.11. Keine externen Supabase-/Deployment-Credentials wurden erfunden.

## Ergebnisse

| Prüfung | Ergebnis |
| --- | --- |
| Frozen Installation | `npm_config_devdir=/workspace/.node-gyp npm ci --cache /workspace/.npm-cache --no-audit --no-fund` erfolgreich. Beschreibbare Caches lösen den anfänglichen nativen Installationsfehler; Verifikation blieb aktiv. |
| Typecheck | `npm run typecheck` erfolgreich, strict TypeScript. |
| Lint | `npm run lint` erfolgreich; aktuelle ESLint-10-/React-Hooks-/Next-Regeln. |
| Domain / SQLite / PostgreSQL | 18 Tests in 3 Dateien erfolgreich mit gesetztem `PG_TEST_URL` zur isolierten Datenbank `nachtrag_test`. |
| Mobile Mehr-Kontext-E2E | Vollständiger Host-/Vier-Player-Ablauf erfolgreich, 393×852, echter Production Server mit unabhängigem Worker. |
| Security-/Netzwerk-E2E | Auth-Trennung, Cross-player-Interaktion, CSRF, Zod, einmaliger Link, Widerruf, Duplicate Submit, mehrere Hosts, Reconnect, offline, verzögerter Refetch, verlorene Antwort nach Commit und STOP-Rennen erfolgreich geprüft. |
| Real-Clock-Scheduler | Nach LIVE alle Browser geschlossen; Worker lieferte das Signal nach 2 Minuten. Später geöffneter Player zeigte den persistenten Inhalt. |
| PostgreSQL HTTP-E2E | Beide mobilen Kern-/Security-Szenarien zusätzlich mit PostgreSQL statt SQLite erfolgreich. |
| Production Build | `npm run build` erfolgreich; alle App-/API-Routen dynamisch, CSP-Proxy aktiv, Migration für Deployment mitgetraced. |
| Seed-Wiederholung | `npm run seed` zweimal erfolgreich, vorhandene Runs und Daten unverändert erhalten. |
| Mobile/desktop review | Screenshots von Host und Player geprüft; 393×852 und 1440×1000 ohne horizontales Scrollen. Kritische Controls mindestens 46px, STOP-Leiste erreichbar, semantische Formulare und native Bestätigungsdialoge. |

Die drei vollständigen SQLite-E2E-Szenarien bestanden zusammen. Die zwei Kern-/Security-Szenarien wurden außerdem gegen PostgreSQL ausgeführt. Der Real-Clock-Test wurde nicht nochmals künstlich beschleunigt: er wartet tatsächlich gut zwei Minuten.

Die PostgreSQL-Tests aktivieren sich nur mit `PG_TEST_URL`, sonst werden ihre vier Fälle ausdrücklich übersprungen. Ein normaler Lauf ohne PostgreSQL ist daher **14 passed, 4 skipped**, kein behaupteter PostgreSQL-Nachweis. Für die hier dokumentierte Prüfung waren **18 passed, 0 skipped** maßgeblich.

## Nachgewiesene Invarianten

- Kein DRAFT→LIVE; Preflight-FAIL blockiert ARM.
- Nur aktuelle persönliche Player-Inhalte werden projiziert; Zukunftstexte liegen serverseitig und nicht im Browser-Bundle.
- Einmaliger High-Entropy-Link, Hash-Speicherung, tokenfreie `/p`-URL, HttpOnly/SameSite-Cookie, Widerruf invalidiert Sessions.
- Bereits bestätigte Interaktionen und ausgeführte Events bleiben bei Replay/Reload eindeutig.
- Pause friert relative Zeit ein; lange Pause lässt verbleibende Story-Zeit unverändert.
- Interaktion, Anchor und abhängige Freigabe committen gemeinsam; Fehler rollen zurück.
- Mehrere SQLite-Verbindungen und PostgreSQL-Clients können dasselbe Event nicht doppelt ausführen.
- STOP bleibt gespeichert und terminal; nach Stop liefern Worker/Retry/Override keine neuen Inhalte.
- Persönlicher Safety-Stop funktioniert auch während PAUSE und wird durch spätere Inhalte nicht aufgehoben.
- Test Reset erzeugt eine neue Test-Generation, archiviert den alten Run und verändert keine Live-Daten.
- Verlorene Antwort nach erfolgreichem Commit erzeugt keine Fake-Erfolgsmeldung; Refetch zeigt den tatsächlichen State.

## Reale Grenzen

- Kein veröffentlichtes HTTPS-Deployment, keine tatsächlichen externen Supabase-/Vercel-Verbindungen geprüft.
- Vier unabhängige Browser-Kontexte sind kein Test über vier physische Geräte/Mobilfunkverbindungen.
- Kein physisches iPhone/Safari geprüft. Die Text-DEMO setzt weder Autoplay noch Vibration oder Background-Tabs voraus.
- Etwa 1s Worker-Intervall plus Request-/Netzwerk-/Provider-Latenz, keine harte Echtzeitgarantie. Einsekunden-Polling ist absichtlich dokumentiert und kein behaupteter WebSocket-Service.
- Bei Netzausfall kann Safety den Server nicht garantiert erreichen; UI fordert eine persönliche Unterbrechung statt Erfolg zu behaupten.
- Milestone 1 enthält Text, Bestätigung und Choice. Editor, zusätzliche Trigger-/Action-/Content-Typen, Display, Prelude, Full-Simulation, Restore/Replay und externe Adapter bleiben in den nächsten Milestones. Keine davon wird als bereits implementiert verkauft.

## PostgreSQL-Prüfung wiederholen

Nur eine isolierte Testdatenbank verwenden, niemals die echte Experience-Datenbank:

```sh
PG_TEST_URL=postgresql://…/nachtrag_test npm run test
E2E_DATABASE_URL=postgresql://…/nachtrag_e2e npm run test:e2e -- --grep-invert Real-clock
```

Die Testnamen sind absichtlich festgelegt und werden vor destruktiven Testoperationen geprüft. Der optionale PostgreSQL-E2E-Weg verlangt eine separat erzeugte `nachtrag_e2e`-Datenbank. Beim vollständigen E2E mit Echtzeit-Test eine frische Datenbank verwenden: STOP ist auch in Tests terminal.

## Aktuelle Cloud-Maschine

Der Production Server und der separate Scheduler wurden zusätzlich mit der tatsächlichen lokalen `.env.local` gestartet. Ein interner funktionaler Request bestätigte Host-Login, vier Player, SQLite, DRAFT und einen gesunden Worker-Heartbeat; die temporäre Prüfsession wurde danach ausgeloggt. Reale Credential-Werte wurden nicht ausgegeben. `install_script` und `start_skill` sind als Cloud-Konfigurationsentwurf gespeichert. Das ist noch keine Veröffentlichung und kein Nachweis eines Starts in einer neuen Cloud-Task.
