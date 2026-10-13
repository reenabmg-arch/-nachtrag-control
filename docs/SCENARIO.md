# Serverseitiges Scenario

Die unveränderliche Produktionsfassung heißt `nachtrag-2026.10` und wird in
`createRun()` aus `src/domain/engine.ts` geladen. Die vollständige dramaturgische
Regiegrundlage steht in [EXPERIENCE.md](EXPERIENCE.md). Player erhalten weiterhin
nur den gerade für sie freigegebenen Inhalt.

## Phasen und Anker

1. `PRE_GAME_START`: vier individuelle Schreibspuren werden ausgeliefert.
2. `SESSION_START`: Reena startet den gemeinsamen Abend; 42 Minuten Normalität.
3. `JANINE_OPENED`: Janine bestätigt die vier sichtbaren Papier-Spuren.
4. `JESSY_CHOICE`: SPUREN ZUERST oder STIMMEN ZUERST verändert die reale
   Lesereihenfolge; der andere Pfad wird atomar abgebrochen.
5. `FALSE_ENDING`: vier unterschiedliche vollständige Protokolle erscheinen.
6. `MELLE_VERIFIED`: Melle bestätigt den gemeinsamen Widerspruch.
7. `REENA_REACTIVATED`: Reena öffnet die vier neuen Texteingaben.
8. `FINAL_ACT`: erst vier bestätigte Sätze geben das gemeinsame Finale frei.

Test und Live besitzen weiterhin getrennte, persistente Runs. Ein unbenutzter
`DRAFT` einer älteren Scenario-Version wird archiviert und sicher ersetzt. Ein
laufender, gestoppter oder historischer Run wird bei Deployments nicht verändert.
