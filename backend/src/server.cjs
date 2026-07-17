const http = require("node:http");

const { InMemoryActivityRepository } = require("./activityRepository.cjs");
const { config, getMissingStravaConfig } = require("./config.cjs");
const { OAuthStateStore } = require("./oauthStateStore.cjs");
const { StravaClient } = require("./stravaClient.cjs");
const { StravaSyncService } = require("./syncService.cjs");
const { InMemoryTokenStore } = require("./tokenStore.cjs");
const { TokenService } = require("./tokenService.cjs");
const { requireUserId, validateMobileRedirect } = require("./validation.cjs");

const client = new StravaClient(config);
const tokenStore = new InMemoryTokenStore();
const tokenService = new TokenService(tokenStore, client);
const stateStore = new OAuthStateStore(config.stateTtlMs);
const repository = new InMemoryActivityRepository();
const syncService = new StravaSyncService({ client, tokenService, repository, config });

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, config.backendBaseUrl);
    if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true, stravaConfigured: getMissingStravaConfig().length === 0 });
    if (request.method === "GET" && url.pathname === "/integrations/strava/oauth/callback") return oauthCallback(url, response);
    const userId = requireUserId(request);
    ensureConfigured();
    if (request.method === "GET" && url.pathname === "/integrations/strava/oauth/start") {
      const mobileRedirect = validateMobileRedirect(url.searchParams.get("mobileRedirect"), config.mobileRedirectUri);
      if (!mobileRedirect) return json(response, 400, { error: "Ungültiges Mobile-Redirect." });
      const state = stateStore.create(userId, mobileRedirect);
      return json(response, 200, { authorizationUrl: client.createAuthorizationUrl(state, url.searchParams.get("includePrivate") === "true") });
    }
    if (request.method === "GET" && url.pathname === "/integrations/strava/status") return json(response, 200, await tokenService.status(userId));
    if (request.method === "GET" && url.pathname === "/integrations/strava/athlete") {
      const token = await tokenService.getValidToken(userId);
      return json(response, 200, (await client.getAthlete(token.accessToken)).data);
    }
    if (request.method === "POST" && url.pathname === "/integrations/strava/sync") return json(response, 200, await syncService.sync(userId));
    if (request.method === "GET" && url.pathname === "/integrations/strava/sync/status") return json(response, 200, { lastSuccessfulSync: await repository.getLastSync(userId, "strava") });
    if (request.method === "DELETE" && url.pathname === "/integrations/strava/connection") { await tokenService.disconnect(userId); return json(response, 200, { connected: false }); }
    const streamMatch = url.pathname.match(/^\/integrations\/strava\/activities\/([^/]+)\/streams$/);
    if (request.method === "GET" && streamMatch) {
      const token = await tokenService.getValidToken(userId);
      const types = (url.searchParams.get("types") || "").split(",");
      return json(response, 200, (await client.getActivityStreams(token.accessToken, streamMatch[1], types)).data);
    }
    return json(response, 404, { error: "Endpunkt nicht gefunden." });
  } catch (error) {
    return json(response, error.statusCode || error.status || 500, { error: error.message, code: error.code || "request_failed", rateLimit: error.rateLimit || null });
  }
});

async function oauthCallback(url, response) {
  const record = stateStore.consume(url.searchParams.get("state"));
  if (!record) return redirect(response, `${config.mobileRedirectUri}?status=error&reason=invalid_state`);
  if (url.searchParams.get("error")) return redirect(response, `${record.mobileRedirectUri}?status=cancelled`);
  const code = url.searchParams.get("code");
  if (!code) return redirect(response, `${record.mobileRedirectUri}?status=error&reason=missing_code`);
  const grantedScopes = (url.searchParams.get("scope") || "").split(",");
  if (!grantedScopes.includes("read") || !grantedScopes.includes("activity:read")) {
    return redirect(response, `${record.mobileRedirectUri}?status=error&reason=insufficient_scope`);
  }
  try {
    const token = await client.exchangeCode(code);
    await tokenService.saveExchange(record.userId, token);
    return redirect(response, `${record.mobileRedirectUri}?status=connected`);
  } catch {
    return redirect(response, `${record.mobileRedirectUri}?status=error&reason=token_exchange`);
  }
}

function ensureConfigured() {
  const missing = getMissingStravaConfig();
  if (missing.length) throw Object.assign(new Error(`Strava ist nicht konfiguriert. Fehlend: ${missing.join(", ")}`), { statusCode: 503, code: "not_configured" });
}
function json(response, status, body) { response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); response.end(JSON.stringify(body)); }
function redirect(response, location) { response.writeHead(302, { location, "cache-control": "no-store" }); response.end(); }

if (require.main === module) server.listen(config.port, "127.0.0.1", () => console.log(`AthleteOS Backend läuft auf http://127.0.0.1:${config.port}`));

module.exports = { client, oauthCallback, server, stateStore, tokenService };
