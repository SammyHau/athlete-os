const http = require("node:http");

const { InMemoryActivityRepository } = require("./activityRepository.cjs");
const { StravaDetailService } = require("./detailService.cjs");
const { EncryptedFileRepository } = require("./encryptedFileRepository.cjs");
const { parseTokenEncryptionKey, tokenEncryptionKeyError } = require("./encryptionKey.cjs");
const { config, getMissingStravaConfig } = require("./config.cjs");
const { OAuthStateStore } = require("./oauthStateStore.cjs");
const { StravaClient } = require("./stravaClient.cjs");
const { StravaSyncService } = require("./syncService.cjs");
const { InMemoryTokenStore } = require("./tokenStore.cjs");
const { TokenService } = require("./tokenService.cjs");
const { requireUserId, validateMobileRedirect } = require("./validation.cjs");
const { InMemoryWebhookQueue, validateWebhookEvent } = require("./webhookService.cjs");

const client = new StravaClient(config);
const encryptionKeyStatus = parseTokenEncryptionKey(config.tokenEncryptionKey);
const persistentRepository = encryptionKeyStatus.valid ? new EncryptedFileRepository(config.repositoryFile, config.tokenEncryptionKey) : null;
const tokenStore = persistentRepository || new InMemoryTokenStore();
const tokenService = new TokenService(tokenStore, client);
const stateStore = new OAuthStateStore(config.stateTtlMs);
const repository = persistentRepository || new InMemoryActivityRepository();
const syncService = new StravaSyncService({ client, tokenService, repository, config });
const detailService = new StravaDetailService({ client, tokenService, repository });
const webhookQueue = new InMemoryWebhookQueue();

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, config.backendBaseUrl);
    if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true, stravaConfigured: getMissingStravaConfig().length === 0, persistenceConfigured: Boolean(persistentRepository) });
    if (request.method === "GET" && url.pathname === "/integrations/strava/oauth/callback") return oauthCallback(url, response);
    if (request.method === "GET" && url.pathname === "/integrations/strava/webhook") {
      if (!config.webhookVerifyToken || url.searchParams.get("hub.verify_token") !== config.webhookVerifyToken) return json(response, 403, { error: "Webhook-Verifizierung fehlgeschlagen." });
      return json(response, 200, { "hub.challenge": url.searchParams.get("hub.challenge") });
    }
    if (request.method === "POST" && url.pathname === "/integrations/strava/webhook") {
      const event = validateWebhookEvent(await readJson(request));
      if (!event) return json(response, 400, { error: "Ungültiges Webhook-Ereignis." });
      await webhookQueue.enqueue(event);
      return json(response, 200, { accepted: true });
    }
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
    if (request.method === "POST" && url.pathname === "/integrations/strava/sync") return json(response, 200, await syncService.sync(userId, new Date(), { backfill: url.searchParams.get("backfill") !== "false" }));
    if (request.method === "GET" && url.pathname === "/integrations/strava/sync/status") return json(response, 200, await syncService.status(userId));
    if (request.method === "POST" && url.pathname === "/integrations/strava/backfill/cancel") return json(response, 200, await syncService.cancelBackfill(userId));
    if (request.method === "DELETE" && url.pathname === "/integrations/strava/connection") { await tokenService.disconnect(userId); return json(response, 200, { connected: false }); }
    if (request.method === "DELETE" && url.pathname === "/integrations/strava/activities") { await repository.deleteActivities(userId, "strava"); return json(response, 200, { deleted: true }); }
    const detailMatch = url.pathname.match(/^\/integrations\/strava\/activities\/([^/]+)$/);
    if (request.method === "GET" && detailMatch) return json(response, 200, await detailService.getDetail(userId, detailMatch[1], url.searchParams.get("refresh") === "true"));
    const streamMatch = url.pathname.match(/^\/integrations\/strava\/activities\/([^/]+)\/streams$/);
    if (request.method === "GET" && streamMatch) {
      const types = (url.searchParams.get("types") || "").split(",");
      return json(response, 200, await detailService.getStreams(userId, streamMatch[1], types, url.searchParams.get("refresh") === "true"));
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
    const token = { ...(await client.exchangeCode(code)), scopes: grantedScopes };
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
async function readJson(request) { const chunks = []; for await (const chunk of request) chunks.push(chunk); if (chunks.reduce((sum, chunk) => sum + chunk.length, 0) > 65536) throw Object.assign(new Error("Anfrage ist zu groß."), { statusCode: 413 }); try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw Object.assign(new Error("Ungültiges JSON."), { statusCode: 400 }); } }

if (require.main === module) {
  if (!encryptionKeyStatus.valid) {
    console.error(tokenEncryptionKeyError(encryptionKeyStatus));
    process.exitCode = 1;
  } else {
    server.listen(config.port, config.host, () => {
      console.log(`AthleteOS Backend läuft lokal auf ${config.host}:${config.port}.`);
      console.log("Für den Smartphone-Test die vom Vorbereitungsskript ausgegebene WLAN-URL verwenden.");
    });
  }
}

module.exports = { client, oauthCallback, server, stateStore, tokenService };
