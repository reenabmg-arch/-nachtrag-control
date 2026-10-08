# NACHTRAG Control — UX

Host Deutsch, mobile-first bei 393×852. Dunkle ruhige Oberflächen, klare Typografie, Safety getrennt, große Touch-Ziele. Echte Statusdaten; keine Fake-Buttons. Milestone 1 fokussiert Live Control, Player, Preflight und Event Log. Editor, Graph, Asset-Management und Stealth Mode folgen später.

## Vollständige zugeordnete Produktanforderungen

# 28. PLAYER VIEW

Player Views müssen mobile-first sein.

Unterstützte Content Blocks mindestens:

TEXT

RICH_TEXT_SAFE

IMAGE

AUDIO

VIDEO

BUTTON

CHOICE

TEXT_INPUT

CODE_INPUT

COUNTDOWN

DOCUMENT

FULLSCREEN_MESSAGE

BLACK_SCREEN

NEUTRAL_SCREEN

SYSTEM_STYLE_SCREEN

PLAYER Views dürfen je Szene komplett anders aussehen.

Keine klassische App-Navigation nötig.

---


# 29. IOS / SAFARI REALITÄT

Berücksichtige echte Browserbeschränkungen.

Insbesondere:

Audio darf auf iPhone/Safari teilweise erst nach User Gesture starten.

Baue deshalb einen sauberen Audio-Unlock-Mechanismus.

Verlasse dich NICHT auf:

- garantiertes Audio-Autoplay
- Web-Vibration auf iPhone
- dauerhaft aktive Background Tabs
- garantierte Fullscreen APIs

Wenn Browserrestriktionen eine Storyfunktion beeinflussen:

realistisch behandeln.

Nicht vortäuschen, dass etwas garantiert funktioniert.

Preflight soll solche Voraussetzungen prüfen.

---


# 37. ACTION NEEDED

Live Control besitzt einen besonders klaren Bereich:

ACTION NEEDED

Nur Dinge, die wirklich Reenas Eingriff brauchen.

Beispiele:

- Player reagiert ungewöhnlich lange nicht
- Automation fehlgeschlagen
- Entscheidung benötigt Host
- Event verspätet
- Safety Event
- Connectivity Problem
- Branch unklar

Dieser Bereich muss visuell höchste Aufmerksamkeit nach Safety bekommen.

---


# 38. LIVE CONTROL UI

Primäre Blöcke:

NOW

NEXT

WAITING

ACTION NEEDED

PLAYERS

CLOCK

SYSTEM

NOW:

Was läuft gerade?

NEXT:

Was ist das nächste wahrscheinlich relevante Event?

WAITING:

Worauf wartet die Engine?

PLAYERS:

Status der vier Personen.

SYSTEM:

Realtime, Netzwerk, Scheduler, Safety.

---


# 39. HOST QUICK ACTIONS

Auf Mobile immer sehr schnell erreichbar:

PAUSE

RESUME

FIRE NEXT

DELAY

SKIP

MARK COMPLETE

STOP ALL

STOP ALL deutlich getrennt und gegen versehentliches Tippen geschützt.

Zum Beispiel:

Long press oder zweistufige Bestätigung.

Aber nicht durch fünf Menüs verstecken.

---


# 40. HOST STEALTH MODE

Reena sitzt selbst mit den anderen zusammen.

Implementiere optionalen diskreten Modus.

Die Oberfläche kann aussehen wie:

- neutrale Uhr
- minimaler Timer
- unauffällige Notiz
- sehr reduzierter Systemscreen

Trotzdem schnelle Geste / sichere Aktion zu den wichtigsten Host Controls.

Keine alberne Geheimagentenoptik.

Keine Cyberpunk-Optik.

---


# 41. CONTROL CENTER DESKTOP

Für Vorbereitung darf Desktop umfangreicher sein.

Bereiche:

Overview

Scenario

Phases

Timeline

Events

Players

Assets

Test Lab

Preflight

Live

Logs

Settings

Nicht zwingend als klassische Sidebar, wenn bessere UX möglich ist.

---


# 42. EVENT EDITOR

Scenario darf nicht nur durch Code editierbar sein.

Baue einen brauchbaren Event Editor.

Felder:

Titel

interne Beschreibung

Phase

Trigger

Anchor

Offset

absolute Zeit

Conditions

Dependencies

Target

Action

Content

Fallback

Late Policy

Priority

Retry Policy

Enabled

Tags

Die UI soll für Nicht-Entwicklerinnen verständlich sein.

---


# 45. TIMELINE

Visualisiere:

- Phasen
- Anchor Points
- Events
- relative Zeiten
- Dependencies
- bereits ausgelöst
- blockiert
- fehlgeschlagen
- aktuelle Position

Timeline darf editierbar sein, wenn dies robust umsetzbar ist.

Ansonsten zuerst verlässlich read-only.

---


# 46. CAUSALITY / DEPENDENCY GRAPH

Erstelle eine Darstellung wie:

PLAYER ACTION
↓
EVENT A
↓
ANCHOR X
↓
+8 MIN
↓
EVENT B
↓
CHOICE
↙      ↘
BRANCH C   BRANCH D

Zweck:

- Story prüfen
- tote Pfade sehen
- Fehler verstehen

Verwende bei Bedarf eine gepflegte Graph Library.

---


# 47. PRE-FLIGHT

Vor ARM zwingend.

Prüfe mindestens:

DATABASE

REALTIME

HOST AUTH

PLAYER LINKS

PLAYER ACCESS

EVENT VALIDITY

DEPENDENCY GRAPH

CYCLE DETECTION

UNREACHABLE EVENTS

MISSING TARGETS

MISSING CONTENT

MISSING ASSETS

MISSING FALLBACKS für kritische Events

AUDIO READINESS

SCHEDULER

SAFETY

STOP ALL

EXPERIENCE VERSION

TIMEZONE

NETWORK STATE

Resultate:

PASS

WARNING

FAIL

Kritisches FAIL blockiert ARM.

Override nur bewusst möglich.

Override wird im Audit Log protokolliert.

---


# 48. ARM

ARM bedeutet:

Das System ist bereit und Automation darf beim Start aktiv werden.

ARM ist bewusste Aktion.

Vor ARM:

Preflight.

Nach ARM:

Scenario Version eingefroren.

---


# 65. AUDIO

Audio ist für immersive Szenen wichtig.

Unterstütze:

- Player Audio
- Display Audio
- Preload
- Lautstärke
- Loop optional
- Stop
- Fade, wenn browserseitig vernünftig

Beachte Safari Restrictions.

Im Preflight anzeigen, wenn Sound noch nicht freigeschaltet wurde.

---


# 68. QR CODES

Generiere QR Codes für:

Player Links

Display Link

Test Links

Keine Token-Werte unnötig serverseitig loggen.

---


# 76. DESIGN DIRECTION

CONTROL:

Premium Theatre Show Control
×
Apple-artige Ruhe
×
hochwertiges Produktionssystem

Dunkel.

Nicht komplett schwarz.

Tiefe neutrale Oberflächen.

Eine disziplinierte Akzentfarbe.

Safety / Error separat deutlich.

Klare Typografie.

Tabular Numbers für Zeiten.

Subtile Hairline Dividers.

Wenig Shadow.

Keine Glasmorphism-Orgie.

Keine Neonlinien.

Keine „Hacker“-Ästhetik.

Keine Emoji UI.

---


# 77. TYPOGRAPHY

Professionelle, sehr gut lesbare UI.

Keine verspielte Schrift im Control Center.

Player Screens dürfen szenenabhängig eigene Typografie verwenden.

---


# 78. MOBILE UX

Primärer Live Viewport:

iPhone.

Teste mindestens ungefähr:

393 × 852

Berücksichtige:

safe-area-inset-top

safe-area-inset-bottom

Dynamic Island

Safari Browser Chrome

virtuelle Tastatur

Touch Targets

Landscape optional

Keine wichtigen Hover-only Interactions.

---


# 79. TOUCH TARGETS

Kritische Buttons ausreichend groß.

Keine 28px Mini-Icons als einzige Live-Steuerung.

---


# 80. LIVE INFORMATION HIERARCHY

Im Live Mode keine Informationsflut.

Priorität visuell:

1. SAFETY
2. ACTION NEEDED
3. NOW
4. NEXT
5. PLAYERS
6. WAITING
7. SYSTEM DETAILS

---


# 81. ACCESSIBILITY

Mindestens:

semantische Elemente

Keyboard Navigation Desktop

Focus Visible

WCAG-konforme Kontraste

aria labels

reduced motion

Screenreader-Grundfunktion

Nicht zugunsten von Immersion komplett opfern.

---


# 82. PERFORMANCE

Player View muss schnell laden.

Keine riesigen JavaScript Bundles nur für einen simplen Story Screen.

Lazy load schwere Editor-/Graph-Komponenten.

Assets sinnvoll preloaden.

---


# 101. MOBILE REVIEW

Nach funktionalem Build:

öffne / teste wichtige Screens mit mobilem Viewport.

Prüfe:

keine horizontale Scrollbar

keine abgeschnittenen Controls

Safe Areas

Keyboard

Touch

LIVE Controls

STOP ALL

Player Screen

---


# 103. UX REVIEW

Denke konkret:

Reena sitzt mit Janine, Jessy und Melle am Tisch.

Sie möchte unauffällig prüfen, ob das nächste Event bereit ist.

Kann sie das in maximal wenigen Sekunden?

Wenn nicht:

UX verbessern.

---


# 106. NICHT-ENTWICKLERIN ANLEITUNG

Zusätzlich:

docs/REENA-QUICKSTART.md

In sehr einfacher Sprache.

Beispiel:

1. App öffnen.
2. Test Mode wählen.
3. PRE-FLIGHT drücken.
4. Alle roten Fehler beheben.
5. ARM drücken.
6. LIVE starten.

Keine technischen Fachbegriffe, wo nicht nötig.

---

