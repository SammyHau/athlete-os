import { integrationMode } from "./integrationConfig";
import { createLocalProvider } from "./local/localProvider";
import { createStravaProvider } from "./strava/stravaProvider";

export function createConfiguredProvider(mode = integrationMode) {
  const providerType = resolveIntegrationProviderType(mode);
  if (providerType === "demo") return createLocalProvider();
  if (providerType === "strava") return createStravaProvider();
  return createUnavailableProvider(mode);
}

export function resolveIntegrationProviderType(mode) {
  if (mode === "demo") return "demo";
  if (mode === "strava") return "strava";
  return "unavailable";
}

function createUnavailableProvider(mode) {
  const message = mode
    ? `Unbekannter Integrationsmodus: ${mode}. Erlaubt sind strava oder demo.`
    : "Der Integrationsmodus ist nicht konfiguriert. Setze EXPO_PUBLIC_INTEGRATION_MODE auf strava oder demo.";
  const fail = async () => { throw Object.assign(new Error(message), { code: "not_configured" }); };
  return {
    id: "unavailable",
    demo: false,
    connect: fail,
    disconnect: fail,
    getConnectionStatus: fail,
    syncActivities: fail,
    getLastSync: fail,
    normalizeActivity: (activity) => activity,
  };
}
