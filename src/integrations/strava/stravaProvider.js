import * as Linking from "expo-linking";

import { normalizeActivity } from "../../data/activity";
import { integrationRequest } from "./stravaApi";

export function createStravaProvider({
  request = integrationRequest,
  createMobileRedirect = () => Linking.createURL("integration/strava"),
  openAuthorizationUrl = Linking.openURL,
} = {}) {
  return {
    id: "strava",
    demo: false,
    async connect() {
      const mobileRedirect = createMobileRedirect();
      const result = await request(`/integrations/strava/oauth/start?mobileRedirect=${encodeURIComponent(mobileRedirect)}`);
      await openAuthorizationUrl(result.authorizationUrl);
      return { connected: false, pending: true };
    },
    async disconnect() { return integrationRequest("/integrations/strava/connection", { method: "DELETE" }); },
    async getConnectionStatus() { return integrationRequest("/integrations/strava/status"); },
    async syncActivities() { return integrationRequest("/integrations/strava/sync", { method: "POST" }); },
    async getLastSync() { return integrationRequest("/integrations/strava/sync/status"); },
    normalizeActivity,
  };
}
