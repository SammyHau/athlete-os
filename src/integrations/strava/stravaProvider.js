import { Linking } from "react-native";

import { normalizeActivity } from "../../data/activity";
import { integrationRequest } from "./stravaApi";

export function createStravaProvider() {
  return {
    id: "strava",
    demo: false,
    async connect() {
      const result = await integrationRequest("/integrations/strava/oauth/start?mobileRedirect=athleteos%3A%2F%2Fintegration%2Fstrava");
      await Linking.openURL(result.authorizationUrl);
      return { connected: false, pending: true };
    },
    async disconnect() { return integrationRequest("/integrations/strava/connection", { method: "DELETE" }); },
    async getConnectionStatus() { return integrationRequest("/integrations/strava/status"); },
    async syncActivities() { return integrationRequest("/integrations/strava/sync", { method: "POST" }); },
    async getLastSync() { return integrationRequest("/integrations/strava/sync/status"); },
    normalizeActivity,
  };
}
