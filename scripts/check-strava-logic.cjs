const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const babel = require("@babel/core");

const root = path.resolve(__dirname, "..");
const sourceRoot = path.join(root, "src") + path.sep;
const originalExtension = require.extensions[".js"];
const originalLoad = Module._load;
const memory = new Map();
require.extensions[".js"] = (module, filename) => {
  if (!filename.startsWith(sourceRoot)) return originalExtension(module, filename);
  const result = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, plugins: ["@babel/plugin-transform-modules-commonjs"] });
  module._compile(result.code, filename);
};
Module._load = (request, parent, isMain) => request === "@react-native-async-storage/async-storage"
  ? { __esModule: true, default: {
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => memory.set(key, value),
    removeItem: async (key) => memory.delete(key),
  } }
  : request === "expo-linking"
    ? { createURL: () => "exp://192.168.2.100:8081/--/integration/strava", openURL: async () => true, getInitialURL: async () => null, addEventListener: () => ({ remove() {} }) }
    : originalLoad(request, parent, isMain);

const { OAuthStateStore } = require("../backend/src/oauthStateStore.cjs");
const { normalizeStravaActivity } = require("../backend/src/stravaMapping.cjs");
const { StravaClient, StravaApiError } = require("../backend/src/stravaClient.cjs");
const { StravaSyncService } = require("../backend/src/syncService.cjs");
const { InMemoryActivityRepository } = require("../backend/src/activityRepository.cjs");
const { InMemoryTokenStore, isTokenExpired } = require("../backend/src/tokenStore.cjs");
const { TokenService } = require("../backend/src/tokenService.cjs");
const { validateMobileRedirect } = require("../backend/src/validation.cjs");
const serverModule = require("../backend/src/server.cjs");
const { reconcileActivities, findPlannedSession } = require("../src/services/activityRepository");
const { normalizeActivity } = require("../src/data/activity");
const activityStorage = require("../src/services/activityStorage");
const { createLocalProvider } = require("../src/integrations/local/localProvider");
const { assertIntegrationProvider } = require("../src/integrations/providerContract");
const { resolveIntegrationProviderType } = require("../src/integrations/providerFactory");
const { createStravaProvider } = require("../src/integrations/strava/stravaProvider");
const { parseStravaCallback } = require("../src/integrations/strava/oauthCallback");
const { createIntegrationRequest } = require("../src/integrations/strava/stravaApi");

let count = 0;
function check(actual, expected, message) { assert.deepEqual(actual, expected, message); count += 1; }
async function rejects(promise, test, message) { await assert.rejects(promise, test, message); count += 1; }

function rawActivity(id, changes = {}) {
  return {
    id, name: `Aktivität ${id}`, sport_type: "Run", start_date: "2026-07-17T05:00:00Z",
    start_date_local: "2026-07-17T07:00:00", elapsed_time: 3600, moving_time: 3500,
    distance: 10000, total_elevation_gain: 80, trainer: false, commute: false, manual: false,
    ...changes,
  };
}

async function run() {
  check(resolveIntegrationProviderType("demo"), "demo", "Nur der explizite Demo-Modus wählt den Demo-Provider");
  check(resolveIntegrationProviderType("strava"), "strava", "Strava-Modus wählt ausschließlich den Strava-Provider");
  check(resolveIntegrationProviderType(""), "unavailable", "Fehlender Modus aktiviert keinen Demo-Fallback");
  check(parseStravaCallback("athleteos://integration/strava?status=cancelled"), "cancelled", "OAuth-Abbruch wird als Abbruch erkannt");
  check(parseStravaCallback("athleteos://integration/strava?status=connected"), "connected", "Nur der erfolgreiche Callback meldet verbunden");
  let openedAuthorizationUrl = null;
  const realProvider = createStravaProvider({
    request: async (requestPath) => {
      check(requestPath.startsWith("/integrations/strava/oauth/start?mobileRedirect="), true, "Connect ruft den OAuth-Start-Endpunkt auf");
      return { authorizationUrl: "https://www.strava.com/oauth/authorize?client_id=fixture" };
    },
    createMobileRedirect: () => "exp://192.168.2.100:8081/--/integration/strava",
    openAuthorizationUrl: async (url) => { openedAuthorizationUrl = url; },
  });
  check((await realProvider.connect()).connected, false, "OAuth-Start simuliert keinen verbundenen Zustand");
  check(openedAuthorizationUrl, "https://www.strava.com/oauth/authorize?client_id=fixture", "Connect öffnet ausschließlich die Backend-Autorisierungs-URL");
  await rejects(createStravaProvider({ request: async () => { throw Object.assign(new Error("Backend nicht erreichbar"), { code: "offline" }); } }).connect(), (error) => error.code === "offline", "Backendfehler fällt nicht auf Demo zurück");
  await rejects(createIntegrationRequest("")("/health"), (error) => error.code === "not_configured", "Fehlende API-URL wird verständlich gemeldet");
  await rejects(createIntegrationRequest("http://192.0.2.1:8787", async () => { throw new Error("offline"); })("/health"), (error) => error.code === "offline", "Unerreichbares Backend wird verständlich gemeldet");
  const health = await createIntegrationRequest("http://192.168.2.100:8787", async () => response(200, { ok: true, stravaConfigured: true }))("/health");
  check(health.ok, true, "Erreichbarer Backend-Healthcheck wird erkannt");

  const mapped = normalizeStravaActivity(rawActivity(123), "2026-07-17T10:00:00Z");
  check(mapped.externalId, "123", "Externe ID wird normalisiert");
  check(mapped.provider, "strava", "Provider wird gesetzt");
  check(mapped.sport, "run", "Laufen wird gemappt");
  check(mapped.startDate, "2026-07-17", "Lokaler Kalendertag wird verwendet");
  check(mapped.averageHeartRate, null, "Fehlende Herzfrequenz bleibt leer");
  check(mapped.averagePower, null, "Fehlende Leistung bleibt leer");
  check(normalizeStravaActivity(rawActivity(124, { sport_type: "Kayaking" })).sport, "other", "Unbekannte Sportart bleibt sonstige Aktivität");
  check(normalizeStravaActivity({ id: 1 }), null, "Beschädigte API-Daten werden verworfen");
  check(Boolean(normalizeActivity(mapped)), true, "Backend-Mapping erfüllt mobiles Modell");
  await activityStorage.saveActivities([mapped], "2026-07-17T10:00:00Z");
  check((await activityStorage.loadActivities()).activities.length, 1, "Aktivitäten überstehen simulierten App-Neustart");
  await activityStorage.resetActivities();
  check((await activityStorage.loadActivities()).status, "empty", "Lokale Aktivitäten können entfernt werden");

  const stateStore = new OAuthStateStore(1000);
  const state = stateStore.create("user-1", "athleteos://integration/strava", 100);
  check(stateStore.consume(state, 200).userId, "user-1", "OAuth-State ist nutzergebunden");
  check(stateStore.consume(state, 201), null, "OAuth-State kann nicht wiederverwendet werden");
  const expiredState = stateStore.create("user-1", "athleteos://integration/strava", 100);
  check(stateStore.consume(expiredState, 1200), null, "Abgelaufener OAuth-State wird abgelehnt");
  check(validateMobileRedirect("exp://192.168.2.100:8081/--/integration/strava", "athleteos://integration/strava"), "exp://192.168.2.100:8081/--/integration/strava", "Privater Expo-Go-Redirect wird akzeptiert");
  check(validateMobileRedirect("https://evil.example/integration/strava", "athleteos://integration/strava"), null, "Externer Mobile-Redirect wird abgelehnt");

  const deniedState = serverModule.stateStore.create("callback-user", "athleteos://integration/strava");
  const deniedResponse = redirectResponse();
  await serverModule.oauthCallback(new URL(`http://localhost/callback?state=${deniedState}&error=access_denied`), deniedResponse);
  check(deniedResponse.location, "athleteos://integration/strava?status=cancelled", "Abgelehnter OAuth-Zugriff kehrt als Abbruch zurück");
  const successfulState = serverModule.stateStore.create("callback-user", "athleteos://integration/strava");
  const originalExchange = serverModule.client.exchangeCode;
  serverModule.client.exchangeCode = async () => ({ accessToken: "fixture-access", refreshToken: "fixture-refresh", expiresAt: 9999999999, athlete: { id: 7, firstname: "Test", lastname: "Athlet" } });
  const successfulResponse = redirectResponse();
  await serverModule.oauthCallback(new URL(`http://localhost/callback?state=${successfulState}&code=one-time&scope=read,activity:read`), successfulResponse);
  serverModule.client.exchangeCode = originalExchange;
  check(successfulResponse.location, "athleteos://integration/strava?status=connected", "Erfolgreicher Callback kehrt ohne Token zur App zurück");
  check((await serverModule.tokenService.status("callback-user")).connected, true, "Erfolgreicher Callback speichert Backend-Verbindung");

  check(isTokenExpired({ expiresAt: 5000 }, 1000), false, "Gültiges Token bleibt aktiv");
  check(isTokenExpired({ expiresAt: 4500 }, 1000), true, "Token wird innerhalb einer Stunde vor Ablauf erneuert");
  const tokenStore = new InMemoryTokenStore();
  await tokenStore.set("user-1", { accessToken: "old-access", refreshToken: "old-refresh", expiresAt: 1 });
  const rotatingClient = { refreshToken: async (token) => {
    check(token, "old-refresh", "Refresh nutzt aktuelles Refresh-Token");
    return { accessToken: "new-access", refreshToken: "new-refresh", expiresAt: 9999999999 };
  } };
  const tokenService = new TokenService(tokenStore, rotatingClient);
  check((await tokenService.getValidToken("user-1")).refreshToken, "new-refresh", "Refresh-Token-Rotation wird gespeichert");
  check((await tokenStore.get("user-1")).accessToken, "new-access", "Neues Access-Token wird gespeichert");
  await tokenStore.set("user-2", { accessToken: "x", refreshToken: "invalid", expiresAt: 1 });
  const failingService = new TokenService(tokenStore, { refreshToken: async () => { throw new Error("invalid"); } });
  await rejects(failingService.getValidToken("user-2"), (error) => error.code === "connection_expired", "Ungültiger Refresh beendet Verbindung");
  check(await tokenStore.get("user-2"), null, "Ungültige Tokens werden entfernt");

  const authClient = new StravaClient({ clientId: "42", clientSecret: "test-client-value", redirectUri: "https://backend/callback" }, async () => response(200, {}));
  const publicUrl = new URL(authClient.createAuthorizationUrl("state", false));
  check(publicUrl.searchParams.get("scope"), "read,activity:read", "Standardflow fordert keinen privaten Scope");
  check(new URL(authClient.createAuthorizationUrl("state", true)).searchParams.get("scope").includes("activity:read_all"), true, "Privater Scope ist opt-in");
  let tokenRequest;
  const exchangeClient = new StravaClient({ clientId: "42", clientSecret: "test-client-value", redirectUri: "https://backend/callback" }, async (_url, options) => {
    tokenRequest = options;
    return response(200, { access_token: "test-access", refresh_token: "test-refresh", expires_at: 9999999999 });
  });
  await exchangeClient.exchangeCode("one-time-code");
  check(tokenRequest.headers["content-type"], "application/x-www-form-urlencoded", "Token-Austausch ist form-kodiert");
  check(new URLSearchParams(tokenRequest.body).get("grant_type"), "authorization_code", "Authorization Code nutzt richtigen Grant");

  const rateClient = new StravaClient({}, async () => response(429, { message: "Rate Limit Exceeded" }, { "x-ratelimit-limit": "100,1000", "x-ratelimit-usage": "100,200" }));
  await rejects(rateClient.request("/athlete", "token"), (error) => error instanceof StravaApiError && error.status === 429 && error.rateLimit.usage === "100,200", "Rate-Limit wird strukturiert gemeldet");

  const planned = [{ id: "plan-1", date: "2026-07-17", sport: "run", durationMinutes: 60 }];
  check(findPlannedSession(mapped, planned), "plan-1", "Passende geplante Einheit wird gefunden");
  check(findPlannedSession({ ...mapped, sport: "bike" }, planned), null, "Falsche Sportart wird nicht verknüpft");
  const first = reconcileActivities([], [mapped], planned);
  check(first.created, 1, "Erster Sync erstellt Aktivität");
  check(first.activities[0].plannedSessionId, "plan-1", "Plan-Verknüpfung wird gespeichert");
  const duplicate = reconcileActivities(first.activities, [mapped], planned);
  check(duplicate.skipped, 1, "Provider und externe ID verhindern Dublette");
  const updated = reconcileActivities(first.activities, [{ ...mapped, name: "Neuer Name" }], planned);
  check(updated.updated, 1, "Geänderte Aktivität wird aktualisiert");
  check(reconcileActivities([], [{ broken: true }], planned).errors, 1, "Ungültige Aktivität zählt als Fehler");

  const pages = [[rawActivity(1), rawActivity(2)], [rawActivity(3)]];
  const requestedAfter = [];
  const syncClient = { listActivities: async (_token, request) => { requestedAfter.push(request.after); return { data: pages[request.page - 1] || [], rateLimit: { usage: "1,1" } }; } };
  const repository = new InMemoryActivityRepository();
  const syncService = new StravaSyncService({ client: syncClient, tokenService: { getValidToken: async () => ({ accessToken: "hidden" }) }, repository, config: { syncPageLimit: 5, syncPageSize: 2 } });
  const sync = await syncService.sync("user-1", new Date("2026-07-18T00:00:00Z"));
  check(sync.created, 3, "Vollständiger Sync verarbeitet Pagination");
  check(sync.lastSuccessfulSync, "2026-07-18T00:00:00.000Z", "Erfolgreicher Sync speichert Zeitpunkt");
  check((await repository.list("user-1", "strava")).length, 3, "Repository enthält eindeutige Aktivitäten");
  const incremental = await syncService.sync("user-1", new Date("2026-07-19T00:00:00Z"));
  check(incremental.updated, 3, "Inkrementeller Sync aktualisiert vorhandene IDs");
  check(requestedAfter[2] > requestedAfter[0], true, "Inkrementeller Sync beginnt nach dem Vollsync-Zeitraum");

  const demo = assertIntegrationProvider(createLocalProvider());
  check((await demo.getConnectionStatus()).connected, false, "Demo startet getrennt");
  await demo.connect();
  const demoSync = await demo.syncActivities();
  check(demoSync.activities.length, 3, "Demo-Provider liefert künstliche Aktivitäten");
  check(demoSync.activities.every((item) => item.provider === "local"), true, "Demo-Daten sind nie echte Strava-Daten");
  await demo.disconnect();
  check((await demo.getConnectionStatus()).connected, false, "Demo kann getrennt werden");

  console.log(`${count} Strava-Integrationsprüfungen erfolgreich.`);
}

function response(status, body, headers = {}) {
  return { ok: status >= 200 && status < 300, status, headers: new Headers(headers), json: async () => body };
}

function redirectResponse() {
  return { location: null, writeHead(_status, headers) { this.location = headers.location; }, end() {} };
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => { require.extensions[".js"] = originalExtension; Module._load = originalLoad; });
