const API_URL = process.env.EXPO_PUBLIC_ATHLETEOS_API_URL?.replace(/\/$/, "") || "";
const USER_ID = "local-samuel";

export function isStravaApiConfigured() { return Boolean(API_URL); }

export async function integrationRequest(path, options = {}) {
  if (!API_URL) throw Object.assign(new Error("Das AthleteOS-Backend ist nicht konfiguriert."), { code: "not_configured" });
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "content-type": "application/json", "x-athleteos-user-id": USER_ID, ...options.headers },
    });
  } catch {
    throw Object.assign(new Error("Das AthleteOS-Backend ist nicht erreichbar. Bereits synchronisierte Daten bleiben verfügbar."), { code: "offline" });
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || "Die Strava-Anfrage ist fehlgeschlagen."), { code: body.code, status: response.status, rateLimit: body.rateLimit });
  return body;
}
