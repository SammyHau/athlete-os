import { integrationApiUrl } from "../integrationConfig";

const API_URL = integrationApiUrl.replace(/\/$/, "");
const USER_ID = "local-samuel";

export function integrationRequest(path, options = {}) {
  return createIntegrationRequest(API_URL)(path, options);
}

export function createIntegrationRequest(apiUrl, requestFetch = fetch) {
  const baseUrl = apiUrl.replace(/\/$/, "");
  return async (path, options = {}) => {
    if (!baseUrl) throw Object.assign(new Error("Das AthleteOS-Backend ist nicht konfiguriert."), { code: "not_configured" });
    let response;
    try {
      response = await requestFetch(`${baseUrl}${path}`, {
        ...options,
        headers: { "content-type": "application/json", "x-athleteos-user-id": USER_ID, ...options.headers },
      });
    } catch {
      throw Object.assign(new Error("Das AthleteOS-Backend ist nicht erreichbar. Bereits synchronisierte Daten bleiben verfügbar."), { code: "offline" });
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(body.error || "Die Strava-Anfrage ist fehlgeschlagen."), { code: body.code, status: response.status, rateLimit: body.rateLimit });
    return body;
  };
}
