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

- Der erste Sync lädt Zusammenfassungen der gesamten erreichbaren Historie in fortsetzbaren Seiten. Spätere Syncs beginnen überlappend beim letzten erfolgreichen Zeitpunkt.
- Pagination ist begrenzt; Streams werden nur explizit abgerufen.
- Primäre Dublette: Provider plus externe ID.
- Optionale Plan-Zuordnung nutzt Datum, Sportart und Dauer. Die geplante Einheit bleibt bestehen.
- Sync-Ergebnisse zählen neue, aktualisierte, übersprungene und fehlerhafte Datensätze.

## Lokale Entwicklung

### Routen und Port

- Standard-Port: `8787`, überschreibbar über `PORT` in `backend/.env`.
- Health: `GET /health`.
- OAuth-Start: `GET /integrations/strava/oauth/start`.
- OAuth-Callback: `GET /integrations/strava/oauth/callback`.
- Verbindung: `GET /integrations/strava/status`, `DELETE /integrations/strava/connection`.
- Athlet: `GET /integrations/strava/athlete`.
- Sync: `POST /integrations/strava/sync`, `GET /integrations/strava/sync/status`.
- Streams: `GET /integrations/strava/activities/:id/streams`.

### Physisches Smartphone mit Expo Go

1. PC und Smartphone mit demselben privaten WLAN verbinden. Gastnetze mit Client-Isolation funktionieren nicht.
2. `powershell.exe -ExecutionPolicy Bypass -File .\scripts\prepare-strava-local.ps1` ausführen.
3. `.env.example` als `.env` und `backend/.env.example` als `backend/.env` verwenden. Keine Backend-Secrets in die mobile `.env` eintragen.
4. Im Strava Developer Portal die vom Vorbereitungsskript ausgegebene reine IPv4-Adresse als **Authorization Callback Domain** eintragen. Kein Protokoll, kein Port und kein Pfad.
5. In `backend/.env` Client-ID und Client-Secret aus dem eigenen Strava-Developer-Konto eintragen. `STRAVA_REDIRECT_URI` muss exakt der vom Skript ausgegebenen Callback-URL entsprechen.
6. In der mobilen `.env` `EXPO_PUBLIC_ATHLETEOS_API_URL` auf die ausgegebene WLAN-Backend-URL und `EXPO_PUBLIC_INTEGRATION_MODE=strava` setzen.
7. Beim ersten Windows-Firewall-Dialog Node.js ausschließlich für **private Netzwerke** freigeben. Falls kein Dialog erscheint, eingehende Verbindungen für Node.js beziehungsweise TCP-Port `8787` nur im privaten Profil erlauben. Keine öffentliche Netzwerkfreigabe anlegen.
8. `powershell.exe -ExecutionPolicy Bypass -File .\scripts\start-athleteos-dev.ps1` ausführen. Das Skript öffnet Backend und Expo-LAN in getrennten Fenstern.
9. In Expo Go den QR-Code aus dem Expo-Fenster scannen. Die App verwendet einen von `expo-linking` erzeugten Expo-Go-Redirect; der Strava-Callback selbst bleibt die HTTP-Route des Backends.

### Erster OAuth-Test und Sync

1. Im Profil unter **Verbundene Dienste** auf **Mit Strava verbinden** tippen.
2. Die Strava-Berechtigungen im externen Browser bestätigen. AthleteOS fordert standardmäßig nur `read` und `activity:read` an.
3. Nach dem Rücksprung zu Expo Go prüfen, dass der Status **Verbunden** lautet. Tokens werden dabei nicht an die App übertragen.
4. **Jetzt synchronisieren** antippen. Der erste Sync lädt Zusammenfassungen seitenweise; bei großen Historien den Import über weitere Syncs fortsetzen.
5. Ergebniszähler im Profil sowie tatsächliche Aktivitäten auf Home, Training und Fortschritt prüfen.

### Fehlerdiagnose

- `http://<PC-IP>:8787/health` im Browser des Smartphones öffnen. Erwartet wird JSON mit `ok: true`.
- Ist die Health-Route nicht erreichbar, WLAN-Client-Isolation, aktuelle PC-IP, Backend-Fenster und private Windows-Firewall-Regeln prüfen.
- Bei `not_configured` fehlen Backend-Werte oder `STRAVA_REDIRECT_URI` stimmt nicht.
- Bei Strava-Callback-Fehlern Callback-Domain im Portal und vollständige Redirect-URI Zeichen für Zeichen vergleichen.
- Bleibt die App im Demo-Modus, mobile `.env` auf `EXPO_PUBLIC_INTEGRATION_MODE=strava` prüfen und Expo anschließend neu starten.
- Nach einem WLAN-Wechsel das Vorbereitungsskript erneut ausführen; private IPv4-Adressen können sich ändern.
- Bei `offline` bleibt der lokale Activity-Cache sichtbar. Backend-Verbindung reparieren und Sync manuell erneut starten.
- Niemals Client Secret, Authorization Code oder Token in Screenshots, Logs oder Supportnachrichten aufnehmen.

## Produktion

- Backend hinter HTTPS und authentifizierter User-Session bereitstellen.
- In-Memory Stores durch Datenbank und verschlüsselte Tokenablage ersetzen.
- Mobile Redirects und CORS auf feste Allowlists begrenzen.
- Webhooks für Löschungen und Änderungen ergänzen.

## Grenzen

- Kein echter OAuth-Aufruf ohne manuell konfigurierte Strava-Zugangsdaten.
- Ohne `ATHLETEOS_TOKEN_ENCRYPTION_KEY` bleibt der lokale Store absichtlich flüchtig; mit Schlüssel übersteht die verschlüsselte Ablage Backend-Neustarts.
- Synchronisation erfolgt per Nutzeraktion. Webhook-Routen und Queue-Vertrag sind vorbereitet, werden lokal aber nicht abonniert.
- Streams werden ausschließlich für sichtbare Analysen manuell und gecacht geladen.

## Meilensteine

- [x] Sicherheits- und Architekturentwurf
- [x] Backend OAuth und Strava-Client
- [x] Activity-Modell und Repository
- [x] Mobile Provider und Profil
- [x] Home, Training und Fortschritt
- [x] Tests und Dokumentation
- [x] Expo- und Bundle-Prüfungen
- [x] Abschließendes Review
