# Strava Integration V1

## Architektur

- Die Expo-App besitzt keine Strava-Secrets und spricht ausschließlich mit dem AthleteOS-Backend.
- `IntegrationProvider` stellt eine providerunabhängige Schnittstelle für `local` und `strava` bereit.
- Tatsächliche Aktivitäten werden getrennt von geplanten Einheiten versioniert gespeichert und über `plannedSessionId` verknüpft.
- Das Backend trennt HTTP-Routen, Konfiguration, OAuth-State, Tokenverwaltung, Strava-Client, Mapping, Sync und Repository-Verträge.

## OAuth und Secrets

- Das Backend erzeugt einen einmaligen, zeitlich begrenzten State und bindet ihn an Nutzer und Mobile-Redirect.
- Authorization Code, Token-Austausch, Ablaufprüfung und Refresh-Token-Rotation erfolgen serverseitig.
- Tokens werden niemals an die App zurückgegeben oder protokolliert.
- Der mitgelieferte In-Memory-TokenStore ist nur für lokale Entwicklung; Produktion benötigt einen verschlüsselten, nutzergebundenen Store.

## Provider-Schnittstelle

Provider implementieren `connect`, `disconnect`, `getConnectionStatus`, `syncActivities`, `getLastSync` und `normalizeActivity`. Garmin kann später denselben Vertrag implementieren.

## Mapping und Synchronisation

- Der erste Sync lädt höchstens 90 Tage, spätere Syncs beginnen beim letzten erfolgreichen Zeitpunkt.
- Pagination ist begrenzt; Streams werden nur explizit abgerufen.
- Primäre Dublette: Provider plus externe ID.
- Optionale Plan-Zuordnung nutzt Datum, Sportart und Dauer. Die geplante Einheit bleibt bestehen.
- Sync-Ergebnisse zählen neue, aktualisierte, übersprungene und fehlerhafte Datensätze.

## Lokale Entwicklung

1. `.env.example` nach `backend/.env` übertragen und eigene Werte eintragen.
2. Strava Callback-Domain und `STRAVA_REDIRECT_URI` im Strava-Developer-Konto identisch konfigurieren.
3. Backend mit `npm.cmd run backend` starten.
4. Für die App `EXPO_PUBLIC_ATHLETEOS_API_URL` setzen. Ohne Konfiguration bleibt `demo` aktiv.

## Produktion

- Backend hinter HTTPS und authentifizierter User-Session bereitstellen.
- In-Memory Stores durch Datenbank und verschlüsselte Tokenablage ersetzen.
- Mobile Redirects und CORS auf feste Allowlists begrenzen.
- Webhooks für Löschungen und Änderungen ergänzen.

## Grenzen

- Kein echter OAuth-Aufruf ohne manuell konfigurierte Strava-Zugangsdaten.
- Lokales Backend verliert Tokens bei Neustart.
- V1 synchronisiert per Nutzeraktion; keine Webhooks oder Hintergrund-Synchronisation.
- Streams werden vorbereitet, aber nicht automatisch geladen.

## Meilensteine

- [x] Sicherheits- und Architekturentwurf
- [x] Backend OAuth und Strava-Client
- [x] Activity-Modell und Repository
- [x] Mobile Provider und Profil
- [x] Home, Training und Fortschritt
- [x] Tests und Dokumentation
- [x] Expo- und Bundle-Prüfungen
- [x] Abschließendes Review
