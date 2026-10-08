# NACHTRAG Control — SAFETY

Safety hat Vorrang. Keine Identitätstäuschung, Tracker oder GPS. Nur Token-Hashes werden gespeichert. Link-Token im URL-Fragment, einmaliger Exchange, danach HttpOnly Session und tokenfreie URL. Player erhält nur aktuell freigegebene Inhalte. Host-Zugang separat. Kritische Mutationen: Auth, Origin-Prüfung, Zod, Idempotenz. STOP hat keine Rate-Limit-Sperre.

## Vollständige zugeordnete Produktanforderungen

# 25. SICHERE PLAYER LINKS

Player URLs dürfen NICHT so aussehen:

/p/janine

oder

/p/reena

Verwende kryptographisch sichere High-Entropy-Tokens.

Noch besser:

Der rohe Link-Token wird nur einmal verwendet, um eine sichere Session einzurichten.

Danach:

1. Token serverseitig prüfen.
2. Token nicht im Klartext speichern.
3. Hash speichern.
4. HttpOnly Secure SameSite Cookie setzen.
5. Browser auf URL ohne Token umleiten.

Dadurch bleibt das Token nicht dauerhaft in:

- Browser-History
- Screenshots
- Referrer
- Logs

Tokens:

- einzeln widerrufbar
- rotierbar
- neu generierbar

Kein Token in Serverlogs schreiben.

---


# 26. HOST AUTHENTICATION

Kein unnötiges komplettes SaaS-Account-System.

Aber Host Control muss geschützt sein.

Implementiere eine für private Nutzung geeignete sichere Lösung.

Beispielsweise:

- starkes Host Secret / Magic Link
- Token Exchange
- HttpOnly Host Session
- optionale lokale PIN für schnellen Zugriff

Keine Host-Secrets im Client Bundle.

Keine Admin-Routen frei zugänglich.

---


# 27. STORY SPOILER SECURITY

Sehr wichtig:

Ein Player-Browser darf NICHT einfach das komplette Scenario herunterladen und dadurch zukünftige Story-Inhalte sehen können.

Player API liefert ausschließlich Inhalte, die dieser Player aktuell sehen darf.

Keine zukünftigen Event-Texte im Client Bundle.

Keine komplette Story-Konfiguration in JavaScript an den Player senden.

---


# 30. PLAYER SAFETY

Safety darf nicht unter Immersion versteckt werden.

Player braucht eine klar erreichbare Funktion wie:

EXPERIENCE STOPPEN

oder vergleichbar.

Bei Aktivierung:

- Safety Event serverseitig persistieren
- laufende Inhalte für diesen Player abbrechen
- Host sofort informieren
- keine fiktionale Fehlermeldung anzeigen
- echte klare Kommunikation zeigen

Safety State schlägt Story State.

---


# 31. GLOBAL STOP ALL

STOP ALL ist die höchste Priorität des gesamten Systems.

Nach STOP ALL:

- keine neuen Storyevents
- keine Timer-Ausführung
- keine neue Content-Auslieferung
- keine automatische Story-Transition
- laufende Trigger soweit möglich abbrechen
- Player Views wechseln in neutralen sicheren Zustand
- Display wechselt in sicheren Zustand
- Host sieht STOPPED
- State persistent
- Audit Log schreiben

Kein Event darf STOP ALL überschreiben.

Auch ein verspäteter Worker / Retry darf danach kein Storyevent mehr feuern.

---


# 60. OFFLINE HOST

Wenn Host Verbindung verliert:

- sichtbarer Offline-Indikator
- letzter bekannter State bleibt sichtbar
- keine erfundenen neuen States
- unsichere Actions nicht einfach als erfolgreich markieren
- Reconnect automatisch
- anschließend authoritative server state holen
- Konflikte verständlich behandeln

Lokale Host-Aktionen dürfen nur gequeued werden, wenn die Semantik sicher/idempotent ist.

---


# 71. PRIVACY

Keine Werbung.

Keine Third-Party Analytics standardmäßig.

Keine Marketing Tracker.

Keine Fingerprinting Libraries.

Keine GPS-Ortung.

Keine unnötigen Geräteinformationen.

Keine Story Tokens in Analytics.

---


# 72. SECURITY

Führe Security von Anfang an mit.

Mindestens prüfen:

Token Entropy

Token Hashing

Session Cookies

Cross-player access

Host access

CSRF

XSS

Story Content Sanitization

SQL Injection

Input Validation

Authorization

Secret Exposure

Replay Attacks

Duplicate Event Requests

IDOR

Rate Limiting auf sensible Endpoints

Token Logging

Referrer Leakage

Open Redirects

---


# 73. HTTP SECURITY

Sinnvolle Security Headers.

Mindestens prüfen:

Content-Security-Policy

Referrer-Policy

X-Content-Type-Options

Frame Ancestors / Clickjacking

Permissions Policy

Kein unnötig unsicheres inline scripting.

---


# 74. STORY CONTENT SANITIZATION

Wenn Rich Text unterstützt wird:

kein beliebiges unsicheres HTML ausführen.

Kein Story Editor darf triviale XSS ermöglichen.

Wenn Custom Story Components existieren:

nur whitelisted components / props.

---


# 75. RATE LIMITING

Sensible Endpoints schützen:

token exchange

host auth

code input

player interaction

manual event fire

STOP ALL nicht so rate-limitieren, dass Safety blockiert wird.

---


# 102. SECURITY REVIEW

Am Ende aktiv reviewen.

Mindestens:

Can Player A fetch Player B?

Can player access host endpoint?

Can revoked link work?

Are future story contents exposed?

Can same interaction be replayed?

Can event be fired twice?

Does STOP persist?

Do logs leak secrets?

Fix offensichtliche Probleme.

---


# 104. FAILURE DRILL

Simuliere mindestens gedanklich/testtechnisch:

Internet fällt 30 Sekunden aus.

Player refreshed Seite.

Host refreshed Seite.

Event Request timed out.

Zwei Host Tabs offen.

Player drückt Button zweimal.

STOP ALL während Event gerade ausgeführt wird.

System muss vernünftig reagieren.

---

