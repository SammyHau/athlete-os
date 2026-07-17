# Activity Intelligence V1

## Datenfluss

- Der mobile Strava-Provider lädt beim Sync ausschließlich normalisierte Aktivitätszusammenfassungen. Geplante Einheiten und tatsächliche Aktivitäten bleiben getrennte Objekte.
- Der erste Sync arbeitet ohne künstliche 90-Tage-Grenze seitenweise durch die erreichbare Historie. `backfillNextPage`, importierte Anzahl, ältester Zeitpunkt, letzter erfolgreicher Sync und Rate-Limit-Zustand liegen im Backend-Repository.
- Nach Abschluss verwendet der inkrementelle Sync einen eintägigen Überlapp. Provider und externe ID verhindern Dubletten.
- Private „Nur ich“-Aktivitäten werden nur mit bewusst erteiltem `activity:read_all` berücksichtigt. Ein Scope-Upgrade erfolgt ausschließlich durch erneute Autorisierung mit `includePrivate=true`.

## Backend-Persistenz

`EncryptedFileRepository` implementiert Token-, Activity-, Sync- und Cache-Verträge. Die gesamte Datei wird mit AES-256-GCM authentifiziert verschlüsselt und atomar ersetzt. Der Schlüssel kommt ausschließlich aus `ATHLETEOS_TOKEN_ENCRYPTION_KEY`; ohne Schlüssel nutzt die lokale Entwicklung sichtbar den flüchtigen Store. Beschädigte Dateien führen zu einem leeren kontrollierten Zustand, nicht zu einem Prozessabbruch.

Für ein Deployment wird dieselbe Schnittstelle durch ein Datenbank-Repository ersetzt. Schlüssel, Tokens, Codes und vollständige Strava-Rohantworten dürfen nicht geloggt werden.

## Lazy Details und Streams

- Beim Öffnen prüft die App `athleteos.activityDetails.v1` und lädt fehlende DetailedActivity-, Runden-, Split- und Zonendaten.
- Backend und App deduplizieren parallele identische Anforderungen.
- Streams werden erst durch den Analyse-Befehl geladen. Unterstützt werden Zeit, Distanz, Herzfrequenz, Kadenz, Leistung, Geschwindigkeit, Höhe, Bewegung, Steigung, Temperatur und datenschutzgerecht nicht standardmäßig angeforderte Koordinaten.
- Nicht verfügbare Zonen oder Streams ergeben leere Teilbereiche, keinen Fehler der gesamten Aktivität.
- Aktualisieren umgeht beide Caches bewusst. Importierte Daten können getrennt von der OAuth-Verbindung gelöscht werden.

## Matching und Soll-Ist

Matching gewichtet Datum, Sport, Dauer, Startzeit, Name und verfügbare Struktur. Ergebnisse sind `automatic`, `probable`, `manual_required`, `manual` oder `unmatched`. Nur sichere Treffer werden automatisch verknüpft. Manuelle Zuordnung und Aufheben verändern ausschließlich die Beziehung.

Der Soll-Ist-Vergleich bewertet Umfang, Intensität, Zielbereich, Struktur und Vollständigkeit separat. Ohne Streams oder Zielwerte bleiben Teilwerte `null`; die Datenqualität lautet hoch, mittel oder eingeschränkt. Es gibt keinen scheinpräzisen Gesamtscore.

## Rate Limits und Webhooks

Backfill-Seiten werden budgetiert. Ab 90 Prozent eines gemeldeten Limits pausiert der Import kontrolliert und behält den Cursor. Details und Streams verwenden Caches statt aggressiver Wiederholungen.

Die lokalen Webhook-Routen validieren Verifikation und Ereignisform und legen create-, update-, delete- sowie Athlete-Deauthorization-Ereignisse in eine austauschbare Queue. Eine Strava-Subscription wird lokal nicht erstellt. Aktivierung erfolgt erst nach Deployment hinter öffentlichem HTTPS, persistenter Queue und authentifizierter Nutzerzuordnung.

## Garmin

Ein späterer Garmin-Adapter implementiert denselben Provider-, Repository- und Normalisierungsvertrag. Provider-spezifische Rohdaten bleiben außerhalb von Screens und Analytics.
