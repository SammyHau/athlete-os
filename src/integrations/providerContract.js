export const requiredProviderMethods = [
  "connect",
  "disconnect",
  "getConnectionStatus",
  "syncActivities",
  "getLastSync",
  "normalizeActivity",
];

export function assertIntegrationProvider(provider) {
  if (!provider || requiredProviderMethods.some((method) => typeof provider[method] !== "function")) {
    throw new Error("Der Integrations-Provider erfüllt den AthleteOS-Vertrag nicht.");
  }
  return provider;
}
