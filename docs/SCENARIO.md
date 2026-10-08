# Scenario-Format und Versionen

Milestone 1 lädt die serverseitige unveränderliche technische Version `demo-v1` aus `createRun()` in `src/domain/engine.ts`. Player erhalten davon ausschließlich ihren aktuell erlaubten Content. ARM sperrt diese Version im Run. Die Runtime speichert Eventstatus, Anchors, Variables, Clock und Interaktionen getrennt vom Host-Client.

Das folgende Exportformat ist die verbindliche Arbeitsgrundlage für **Milestone 2**, noch keine behauptete Import-/Export-Funktion:

```json
{
  "schema_version": 1,
  "experience": { "stable_key": "nachtrag-demo", "title": "DEMO", "timezone": "Europe/Berlin" },
  "version": "demo-v1",
  "phases": [{ "id": "ACT_1", "order": 1, "enabled": true }],
  "events": [],
  "conditions": [],
  "dependencies": [],
  "story_variables": [],
  "content": [],
  "asset_references": []
}
```

Die Events benötigen sämtliche in `docs/ENGINE.md` Abschnitt 16 genannten Definitionsfelder. Persistierte Runtime-Felder (`status`, Claim, Timestamps, Execution, Request-Receipt) werden bei einem späteren Scenario-Export von Definitionen getrennt. Import muss mit Zod alle Felder, Referenzen, Targets, Zyklen, Trigger, Asset-Verfügbarkeit und Schema-Version prüfen. Alte Schema-Versionen brauchen explizite Migrationen; keine stillen Datenverluste. Ein bearbeitetes Scenario erstellt eine neue Draft-Version und verändert keinen bewaffneten oder laufenden Run.
