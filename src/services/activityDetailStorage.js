import AsyncStorage from "@react-native-async-storage/async-storage";

const DETAIL_STORAGE_KEY = "athleteos.activityDetails.v1";
let pendingReads = null;

async function readCache() {
  if (!pendingReads) pendingReads = AsyncStorage.getItem(DETAIL_STORAGE_KEY).then((value) => { try { const parsed = value ? JSON.parse(value) : {}; return parsed && typeof parsed === "object" ? parsed : {}; } catch { return {}; } }).finally(() => { pendingReads = null; });
  return pendingReads;
}

export async function loadActivityDetail(activityId) { const cache = await readCache(); return cache[activityId] ?? null; }
export async function saveActivityDetail(activityId, value) { const cache = await readCache(); await AsyncStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify({ ...cache, [activityId]: value })); }
export async function resetActivityDetails() { await AsyncStorage.removeItem(DETAIL_STORAGE_KEY); }
