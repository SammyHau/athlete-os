import { normalizeActivity } from "../../data/activity";
import { createDemoActivities } from "./demoData";

export function createLocalProvider() {
  let connected = false;
  let lastSync = null;
  return {
    id: "local",
    demo: true,
    async connect() { connected = true; return { connected: true, demo: true, athlete: { firstname: "Demo", lastname: "Athlet" } }; },
    async disconnect() { connected = false; lastSync = null; return { connected: false, demo: true }; },
    async getConnectionStatus() { return { connected, demo: true, athlete: connected ? { firstname: "Demo", lastname: "Athlet" } : null }; },
    async syncActivities() {
      if (!connected) throw new Error("Demo-Verbindung ist nicht aktiv.");
      lastSync = new Date().toISOString();
      return { activities: createDemoActivities(new Date(lastSync)), lastSuccessfulSync: lastSync, backendResult: { created: 3, updated: 0, skipped: 0, errors: 0 } };
    },
    async getLastSync() { return lastSync; },
    async getActivityDetail() { throw new Error("Für Demo-Aktivitäten sind keine zusätzlichen Detaildaten verfügbar."); },
    async getActivityStreams() { return { streams: {}, cached: true }; },
    async deleteImportedActivities() { return { deleted: true }; },
    async cancelBackfill() { return { backfillPausedByUser: true }; },
    normalizeActivity,
  };
}
