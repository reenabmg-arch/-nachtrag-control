# NACHTRAG Control — PRODUCT

NACHTRAG ist eine private Experience für Reena, Janine, Jessy und Melle. Reena ist Host und Mitspielerin. DEMO ist ausschließlich eine technische Demonstration, keine endgültige Handlung.

## Vollständige zugeordnete Produktanforderungen

# 1. PROJEKTNAME

Die Anwendung heißt:

NACHTRAG Control

Repository:
aktuelles Repository

Interne technische Bezeichnungen dürfen Englisch sein.

Die sichtbare Host-Benutzeroberfläche soll primär DEUTSCH sein.

---


# 2. WAS NACHTRAG IST

NACHTRAG ist eine private immersive Live-Experience für vier Freundinnen:

- Reena
- Janine
- Jessy
- Melle

Sie verbindet Prinzipien aus:

- Alternate Reality Games
- Immersive Theatre
- Pervasive Games
- transmedialem Storytelling
- interaktiver Narration
- hochwertigen Escape Experiences
- Show Control
- Experience Design
- physischen Installationen
- dynamischen digitalen Systemen
- realen Ereignissen
- personalisierten digitalen Momenten

WICHTIG:

Es ist ausdrücklich KEIN klassischer Escape Room für zuhause.

Die Anwendung selbst soll während der Experience möglichst wenig wie eine „Game App“ wirken.

Sie ist primär das unsichtbare technische Nervensystem hinter der Experience.

---


# 3. ZENTRALE BESONDERHEIT

Reena ist gleichzeitig:

- Organisatorin
- technische Betreiberin
- Mitspielerin

Das ist eine fundamentale Produktanforderung.

Es sitzt KEIN externer Game Master permanent am Laptop.

Während des eigentlichen Abends soll Reena so wenig wie möglich aktiv steuern müssen.

Die Anwendung muss deshalb:

- möglichst viel automatisieren
- robust auf Abweichungen reagieren
- live leicht korrigierbar sein
- auf einem iPhone diskret steuerbar sein
- wichtige Aktionen in maximal 1–2 bewussten Interaktionen ermöglichen

Die Live-Steuerung darf nicht davon ausgehen, dass Reena fünf Minuten lang komplexe Menüs bedienen kann.

---


# 4. DIE EXPERIENCE KANN BEREITS VORHER BEGINNEN

Ein wichtiger Bestandteil von NACHTRAG ist:

Die Experience kann bereits Stunden oder Tage vor dem gemeinsamen Abend beginnen.

Dabei kann zunächst noch nicht offensichtlich sein, dass bereits eine inszenierte Experience läuft.

Das System muss deshalb unterscheiden können zwischen:

PRELUDE / PRE-GAME
und
LIVE EVENING.

Unterstütze langfristig z. B.:

- geplante Vorab-Ereignisse
- individuelle Player-Inhalte
- neutrale Landingpages
- zeitabhängige Freischaltungen
- externe Trigger-Adapter
- Links / QR-Codes
- spätere optionale Notification-Adapter

ABER:

Baue keine problematische reale Identitätstäuschung.

Keine gefälschten Behörden-Websites, die echte Behörden imitieren.

Keine echten Accounts anderer Personen imitieren.

Keine invasive Überwachung.

Keine permanente Standortverfolgung.

Story-Seiten dürfen fiktive Designs besitzen, müssen technisch aber klar innerhalb unseres eigenen Systems bleiben.

---


# 5. PRODUKTZIEL

Das System soll eine komplette Experience abbilden können:

ENTWERFEN
→
VALIDIEREN
→
TESTEN
→
VERÖFFENTLICHEN
→
PRE-FLIGHT
→
ARM
→
PRE-GAME / LIVE
→
AUTOMATISIEREN
→
ÜBERWACHEN
→
MANUELL EINGREIFEN
→
RECOVERY
→
FALSE ENDING
→
REAKTIVIERUNG
→
FINALE
→
EPILOG
→
AUSWERTEN

Das Produkt soll sich eher anfühlen wie:

professionelles Theatre Show Control
+
Mission Control
+
Story State Machine
+
Event Automation

und NICHT wie:

- generisches Admin Dashboard
- Escape-Room-Webseite
- Aufgabenmanager
- Gaming-HUD
- Discord Bot Panel

---


# 6. ERSTE PRIORITÄT: FUNKTIONIERENDER VERTICAL SLICE

Versuche NICHT zuerst, jedes spätere Feature perfekt auszubauen.

Baue zuerst einen real funktionierenden Vertical Slice.

Der MUSS vollständig funktionieren:

Experience laden
→
vier Spielerinnen vorhanden
→
Player Links erzeugen
→
Preflight
→
ARM
→
LIVE
→
automatisches Event
→
Player bekommt Inhalt
→
Player interagiert
→
Interaktion wird serverseitig gespeichert
→
abhängiges Event wird freigeschaltet
→
Host sieht Änderung
→
Pause
→
Resume
→
Manual Override
→
STOP ALL
→
Event Log
→
Reset im Test Mode

Erst wenn dieser Ablauf funktioniert, baue weitere Komfortfunktionen.

---


# 7. PRIORITÄTEN

Bei jeder Architektur- und Produktentscheidung gilt diese Reihenfolge:

1. Safety
2. korrekter Story-State
3. keine doppelten / verlorenen Events
4. Live-Robustheit
5. Recovery
6. schnelle Host-Bedienung
7. Datensicherheit
8. Player-Realtime
9. Immersion
10. visuelles Finishing

Eine wunderschöne UI mit unzuverlässiger Event Engine ist ein Fehlschlag.

---


# 13. STORY PHASES

Phasen dürfen NICHT hart im Frontend kodiert sein.

Eine Demo-Konfiguration kann enthalten:

PRELUDE

ARRIVAL

ACT_1

ESCALATION

ACT_2

FALSE_ENDING

REACTIVATION

FINAL_ACT

EPILOGUE

Phasen müssen:

- sortierbar
- aktivierbar/deaktivierbar
- konfigurierbar
- versioniert

sein.

---


# 14. FALSE ENDING

FALSE ENDING ist ein wichtiges Story-Konzept.

Es darf technisch NICHT dasselbe sein wie COMPLETED.

Im FALSE ENDING können:

- sichtbare Story-Events scheinbar enden
- normale Oberflächen ruhig werden
- spätere Timer verborgen weiterlaufen
- Trigger weiterhin warten
- Reaktivierungs-Events vorbereitet bleiben

COMPLETED bedeutet dagegen wirklich abgeschlossen.

---


# 23. EVENT TARGETS

Events können richten an:

ALL_PLAYERS

ONE_PLAYER

MULTIPLE_PLAYERS

HOST

DISPLAY

SYSTEM

Reena hat eine Besonderheit:

Sie ist sowohl Host als auch Spielerin.

Host-Zugriff und Player-Zugriff müssen technisch getrennt sein.

---


# 90. DEMO SCENARIO

Erstelle eine kleine, eindeutig mit

DEMO

markierte Story.

Sie soll NICHT behaupten, die endgültige NACHTRAG-Handlung zu sein.

Sie soll nur Technik demonstrieren.

Beispielhafter Flow:

LIVE START

↓

2 Minuten später Event für Janine

↓

Janine sieht Fullscreen Message

↓

Janine bestätigt

↓

Anchor DEMO_ACK entsteht

↓

30 Sekunden später Content für Jessy

↓

Jessy trifft Choice A/B

↓

je nach Choice anderer Branch

↓

Host sieht Resultat live

↓

Finaler Demo Screen

Die tatsächlichen Texte selbst neutral als DEMO halten.

---


# 92. PRE-GAME DEMO

Erstelle zusätzlich einen kleinen Demo-Pregame-Event, damit klar ist, dass Events auch vor dem gemeinsamen LIVE-Abend geplant werden können.

---


# 118. DEFINITION OF DONE – CORE

Nicht fertig, bis ich tatsächlich kann:

1.
Host Control öffnen.

2.
Die vier Spielerinnen sehen.

3.
Sichere individuelle Player Links erzeugen.

4.
Einen Player Link in zweitem Browser öffnen.

5.
Demo Scenario auswählen.

6.
PRE-FLIGHT ausführen.

7.
ARM ausführen.

8.
LIVE starten.

9.
Automatisches Event auslösen lassen.

10.
Event auf Player Device sehen.

11.
Als Player reagieren.

12.
Interaction serverseitig speichern.

13.
Abhängiges Folgeevent automatisch aktivieren.

14.
Änderung Host-seitig sehen.

15.
Pause drücken.

16.
Story Time bleibt stehen.

17.
Resume drücken.

18.
Timer korrekt weiterlaufen.

19.
Event manuell auslösen / verschieben / überspringen.

20.
STOP ALL drücken.

21.
Player sieht sicheren neutralen Zustand.

22.
Keine späteren Events feuern.

23.
Event Log ansehen.

24.
Test Run resetten.

---

