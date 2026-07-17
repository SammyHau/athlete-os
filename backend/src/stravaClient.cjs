const STRAVA_API = "https://www.strava.com/api/v3";
const STRAVA_OAUTH = "https://www.strava.com/oauth";

class StravaApiError extends Error {
  constructor(message, status, code, rateLimit) {
    super(message); this.name = "StravaApiError"; this.status = status; this.code = code; this.rateLimit = rateLimit;
  }
}

class StravaClient {
  constructor(config, fetchImpl = fetch) { this.config = config; this.fetch = fetchImpl; }
  createAuthorizationUrl(state, includePrivate = false) {
    const url = new URL(`${STRAVA_OAUTH}/mobile/authorize`);
    url.searchParams.set("client_id", this.config.clientId);
    url.searchParams.set("redirect_uri", this.config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("approval_prompt", "auto");
    url.searchParams.set("scope", includePrivate ? "read,activity:read,activity:read_all" : "read,activity:read");
    url.searchParams.set("state", state);
    return url.toString();
  }
  async exchangeCode(code) { return this.tokenRequest({ grant_type: "authorization_code", code }); }
  async refreshToken(refreshToken) { return this.tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken }); }
  async tokenRequest(fields) {
    const body = new URLSearchParams({ client_id: this.config.clientId, client_secret: this.config.clientSecret, ...fields });
    const response = await this.fetch(`${STRAVA_OAUTH}/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await safeJson(response);
    if (!response.ok || !data.access_token || !data.refresh_token) throw apiError(response, data, "Strava-Token konnten nicht verarbeitet werden.");
    return mapToken(data);
  }
  async deauthorize(token, tokenType = "refresh_token") {
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString("base64");
    const response = await this.fetch(`${STRAVA_OAUTH}/revoke`, {
      method: "POST",
      headers: { authorization: `Basic ${credentials}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token, token_type_hint: tokenType }).toString(),
    });
    if (!response.ok) throw apiError(response, await safeJson(response), "Strava-Verbindung konnte nicht getrennt werden.");
  }
  async getAthlete(accessToken) { return this.request("/athlete", accessToken); }
  async listActivities(accessToken, { after, before, page, perPage }) {
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (Number.isFinite(after)) query.set("after", String(after));
    if (Number.isFinite(before)) query.set("before", String(before));
    return this.request(`/athlete/activities?${query}`, accessToken);
  }
  async getActivity(accessToken, activityId) {
    return this.request(`/activities/${encodeURIComponent(activityId)}?include_all_efforts=true`, accessToken);
  }
  async getActivityZones(accessToken, activityId) {
    return this.request(`/activities/${encodeURIComponent(activityId)}/zones`, accessToken);
  }
  async getActivityStreams(accessToken, activityId, types) {
    const allowed = ["time", "distance", "heartrate", "cadence", "watts", "velocity_smooth", "altitude", "moving", "grade_smooth", "temp", "latlng"];
    const selected = types.filter((type) => allowed.includes(type));
    if (!selected.length) throw Object.assign(new Error("Mindestens ein gültiger Stream-Typ ist erforderlich."), { statusCode: 400 });
    return this.request(`/activities/${encodeURIComponent(activityId)}/streams?keys=${selected.join(",")}&key_by_type=true`, accessToken);
  }
  async request(path, accessToken) {
    const response = await this.fetch(`${STRAVA_API}${path}`, { headers: { authorization: `Bearer ${accessToken}` } });
    const data = await safeJson(response);
    if (!response.ok) throw apiError(response, data, response.status === 429 ? "Strava-Rate-Limit erreicht." : "Strava-Anfrage fehlgeschlagen.");
    return { data, rateLimit: readRateLimit(response.headers) };
  }
}

function mapToken(data) {
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Number(data.expires_at), athlete: data.athlete ?? null, scope: data.scope ?? "" };
}
function readRateLimit(headers) { return { limit: headers.get("x-ratelimit-limit"), usage: headers.get("x-ratelimit-usage") }; }
function apiError(response, data, message) { return new StravaApiError(message, response.status, data?.message ?? null, readRateLimit(response.headers)); }
async function safeJson(response) { try { return await response.json(); } catch { return null; } }

module.exports = { StravaApiError, StravaClient, mapToken, readRateLimit };
