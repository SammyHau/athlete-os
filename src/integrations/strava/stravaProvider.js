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
    async connect(includePrivate = false) {
      const mobileRedirect = createMobileRedirect();
      const result = await request(`/integrations/strava/oauth/start?mobileRedirect=${encodeURIComponent(mobileRedirect)}&includePrivate=${includePrivate === true}`);
      await openAuthorizationUrl(result.authorizationUrl);
      return { connected: false, pending: true };
    },
    async disconnect() { return integrationRequest("/integrations/strava/connection", { method: "DELETE" }); },
    async getConnectionStatus() { return integrationRequest("/integrations/strava/status"); },
    async syncActivities() { return integrationRequest("/integrations/strava/sync", { method: "POST" }); },
    async getLastSync() { return integrationRequest("/integrations/strava/sync/status"); },
    async getActivityDetail(activityId, refresh = false) { return integrationRequest(`/integrations/strava/activities/${encodeURIComponent(activityId)}${refresh ? "?refresh=true" : ""}`); },
    async getActivityStreams(activityId, types, refresh = false) { const query = new URLSearchParams({ types: types.join(",") }); if (refresh) query.set("refresh", "true"); return integrationRequest(`/integrations/strava/activities/${encodeURIComponent(activityId)}/streams?${query}`); },
    async deleteImportedActivities() { return integrationRequest("/integrations/strava/activities", { method: "DELETE" }); },
    async cancelBackfill() { return integrationRequest("/integrations/strava/backfill/cancel", { method: "POST" }); },
    normalizeActivity,
  };
}
