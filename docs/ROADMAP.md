# NACHTRAG Control — ROADMAP

## Umfang und Reihenfolge

1. **Milestone 1:** kompletter Host–Player-Vertical-Slice mit Safety, persistenter Engine, Automation, Override, Audit Log, Test Reset; Quality Gate tatsächlich ausführen.
2. **Milestone 2:** Scenario Editor, typisierte vollständige Trigger-/Action-Bibliothek, Phasen, Timeline, Graph, Import/Export, Assets und Display.
3. **Milestone 3:** Prelude, False Ending/Reaktivierung, Snapshot Restore, Recovery, Simulator und Replay.
4. **Milestone 4:** optionale Adapter, PWA/Push, produktiver Mehrgeräte-/Safari-Test, Operations-Härtung.

Die unten vollständig erhaltenen Originalanforderungen bilden das gesamte Backlog. Das Vorhandensein einer Anforderung bedeutet nicht, dass sie in Milestone 1 schon implementiert ist. Keine Core-TODOs in Milestone 1.

## Übergreifender Arbeitsauftrag

# MASTER BUILD DIRECTIVE
# NACHTRAG CONTROL
# Production-grade immersive experience control system

Du bist für dieses Projekt gleichzeitig:

- Principal Software Engineer
- Full-Stack Engineer
- Systems Architect
- Product Designer
- UX Engineer
- Realtime Systems Engineer
- QA Engineer
- Security Reviewer
- DevOps Engineer

Deine Aufgabe ist NICHT, mir ein Konzept, eine Machbarkeitsstudie, ein Wireframe oder einen hübschen Prototypen zu liefern.

DEINE AUFGABE IST:

NACHTRAG Control im aktuellen Repository tatsächlich zu bauen.

Arbeite direkt im vorhandenen GitHub-Repository.

Wenn das Repository aktuell nur README.md oder praktisch keinen Projektcode enthält, initialisiere das vollständige Projekt selbst.

Treffe technische Entscheidungen selbstständig.

Ich bin keine Entwicklerin.

Gib mir deshalb keine technischen Auswahlfragen zurück wie:

- Supabase oder Firebase?
- Zustand mit X oder Y?
- Welche Komponentenbibliothek?
- Welche Ordnerstruktur?
- Welches Testing-Framework?
- Welche Datenbankstruktur?
- Soll ich TypeScript benutzen?

Solche Entscheidungen sind deine Aufgabe.

Frage mich nur dann etwas, wenn eine inhaltliche Entscheidung über die tatsächliche Experience ohne meine Antwort unmöglich ist.

Wenn eine technische Schwierigkeit auftritt, löse sie selbst, solange das vernünftig möglich ist.

Höre NICHT nach:

- Projektinitialisierung
- Datenbankschema
- erstem Dashboard
- hübschem Mockup
- einigen statischen Komponenten
- einer TODO-Liste

auf.

Arbeite bis zu einem funktionierenden End-to-End-System.

---



## Vollständige zugeordnete Produktanforderungen

# 114. MINIMIERE MEINE ARBEIT

Wenn du etwas innerhalb des Repositorys selbst erledigen kannst:

tu es.

Gib es nicht mir als Aufgabe zurück.

---


# 115. KEINE ÜBERPLANUNG

Du darfst kurz intern analysieren.

Aber verbringe nicht den gesamten Task mit:

- Architektur-Dokument
- Plan
- Roadmap

und höre dann auf.

Code schreiben.

Tests schreiben.

Ausführen.

Iterieren.

---


# 116. ITERATIVE BUILD ORDER

Arbeite ungefähr in dieser Reihenfolge:

A.
Repository prüfen.

B.
Projekt initialisieren.

C.
Domain Engine + Clock.

D.
Datenmodell.

E.
Demo Scenario.

F.
Server APIs.

G.
Host Control Grundfunktion.

H.
Player View.

I.
End-to-End Flow.

J.
Realtime.

K.
Safety.

L.
Pause/Resume.

M.
Test Mode.

N.
Preflight.

O.
Versionierung/Snapshots.

P.
Editor/Timeline.

Q.
Offline/Recovery.

R.
Tests.

S.
Mobile Review.

T.
Security Review.

U.
Docs.

V.
Production Build.

Wenn du begründet eine leicht andere Reihenfolge brauchst, entscheide selbst.

---


# 117. MILESTONES

Nutze sinnvolle Git Commits / Checkpoints, wenn Codex-Umgebung das erlaubt.

Beispiele:

core engine

database foundation

host/player vertical slice

realtime and safety

test mode

scenario editor

production hardening

Keine 100 winzigen Commits nötig.

Keine History zerstören.

---


# 120. WENN ETWAS EXTERN FEHLT

Wenn z. B. Supabase Credential fehlt:

Implementierung trotzdem vollständig vorbereiten.

Tests lokal/mockbar durchführen.

Am Ende exakt:

BLOCKED EXTERNAL:
Supabase Project Credentials

und nicht:

„Projekt kann leider nicht gebaut werden.“

---


# 121. ABSCHLUSSFORMAT

Wenn du wirklich fertig bist, antworte kompakt:

BUILT

Was funktioniert tatsächlich?

TESTED

Welche konkreten Checks hast du selbst ausgeführt und mit welchem Ergebnis?

SECURITY

Welche wichtigen Sicherheitsmaßnahmen sind implementiert?

OPEN

Was konnte nur wegen fehlender externer Zugänge / Services nicht vollständig real getestet werden?

NEXT FOR REENA

Nur meine tatsächlich notwendigen nächsten Schritte.

Keine Marketing-Zusammenfassung.

Keine 50-Punkte-Wunschliste.

---


# 122. WICHTIGSTE ANWEISUNG

Dies ist kein UI-Prototyp.

Dies ist kein Architektur-Exercise.

Dies ist kein „ich zeige dir, wie man so etwas bauen könnte“.

BAUE DIE APP.

Beginne jetzt mit dem aktuellen Repository.

Prüfe den bestehenden Inhalt.

Initialisiere das Projekt.

Implementiere zuerst die funktionierende Domain Engine und den vollständigen End-to-End-Vertical-Slice.

Arbeite danach weiter durch die Anforderungen.

Teste das Ergebnis selbst.

Behebe gefundene Probleme selbst.

Höre nicht nach einem hübschen Dashboard auf.

Starte jetzt.
## Stand nach dem ersten Build

Milestone 1 ist als serverseitig persistenter DEMO-Vertical-Slice implementiert und lokal validiert. Der Nachweis steht in `docs/VALIDATION.md`; die einfache Bedienung in `docs/REENA-QUICKSTART.md`. Das vollständige spätere Backlog bleibt bewusst erhalten. Die nächsten Milestones wurden nicht parallel als halbfertige Oberflächen angefangen.
