import AsyncStorage from "@react-native-async-storage/async-storage";

import { normalizeActivities } from "../data/activity";

export const ACTIVITY_STORAGE_KEY = "athleteos.activities.v1";
export const ACTIVITY_STORAGE_VERSION = 1;

export async function loadActivities() {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (stored === null) return { status: "empty", activities: [], lastSync: null };
    const payload = JSON.parse(stored);
    const activities = normalizeActivities(payload?.activities);
    const lastSync = payload?.lastSync === null || Number.isFinite(Date.parse(payload?.lastSync)) ? payload.lastSync : undefined;
    if (payload?.version !== ACTIVITY_STORAGE_VERSION || !activities || lastSync === undefined) return { status: "invalid", activities: [], lastSync: null };
    return { status: "loaded", activities, lastSync };
  } catch (error) {
    console.error("Synchronisierte Aktivitäten konnten nicht geladen werden.", error);
    return { status: "error", activities: [], lastSync: null };
  }
}

export async function saveActivities(activities, lastSync) {
  const normalized = normalizeActivities(activities);
  if (!normalized || (lastSync !== null && !Number.isFinite(Date.parse(lastSync)))) throw new Error("Ungültige Aktivitäten werden nicht gespeichert.");
  await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify({ version: ACTIVITY_STORAGE_VERSION, activities: normalized, lastSync }));
}

export async function resetActivities() { await AsyncStorage.removeItem(ACTIVITY_STORAGE_KEY); }
