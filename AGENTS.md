# NACHTRAG Control

Baue im vorhandenen Checkout; keine zusätzlichen Worktrees ohne ausdrücklichen Auftrag. Host-UI Deutsch. Reena ist Host und Player; Zugänge strikt trennen. Safety und serverseitige Wahrheit gehen vor Optik. Keine Fake-Buttons oder Core-TODOs.

## Navigation
- `docs/PRODUCT.md`: Produkt, DEMO und End-to-End-Ziel.
- `docs/ARCHITECTURE.md`: Schichten, Daten, Infrastruktur und Deployment.
- `docs/ENGINE.md`: Zustände, Clock, Trigger, Idempotenz und Recovery.
- `docs/SAFETY.md`: Safety, Auth, Privacy und Security.
- `docs/UX.md`: deutsche Host-Steuerung und mobile Player-Views.
- `docs/TESTING.md`: verbindliche Prüfungen und Qualitätsgate.
- `docs/ROADMAP.md`: Milestones und vollständiger Arbeitsauftrag.

Implementiere zuerst ausschließlich Milestone 1 end-to-end. Domain unabhängig von React; alle sicherheitsrelevanten Mutationen serverseitig, atomar und idempotent. Speichere keine Klartext-Tokens, sende keine zukünftigen Story-Inhalte an Player. STOP bleibt terminal, Test Reset verändert keine Live-Daten.

Vor Abschluss install, typecheck, lint, Tests, Mehr-Kontext-E2E und Production Build selbst ausführen. Dokumentiere echte Resultate und externe Grenzen. Keine Secrets in Git oder Logs.
