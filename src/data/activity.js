import { isISODate } from "./trainingPlan";

export const activityProviders = ["local", "strava"];
export const activitySports = ["run", "bike", "swim", "strength", "walk", "hike", "other"];

export function normalizeActivity(value) {
  if (!value || typeof value !== "object" || typeof value.externalId !== "string" || !value.externalId.trim()
    || !activityProviders.includes(value.provider) || typeof value.name !== "string" || !value.name.trim()
    || !isISODate(value.startDate) || !Number.isFinite(Date.parse(value.startDateTime))
    || !Number.isFinite(Date.parse(value.localStartDateTime)) || !activitySports.includes(value.sport)
    || !Number.isFinite(Number(value.durationSeconds)) || Number(value.durationSeconds) < 0
    || !Number.isFinite(Date.parse(value.syncedAt))) return null;
  const externalId = value.externalId.trim();
  return {
    id: `${value.provider}:${externalId}`,
    externalId,
    provider: value.provider,
    athleteId: optionalString(value.athleteId),
    source: optionalString(value.source) ?? (value.provider === "strava" ? "Strava" : "AthleteOS Demo"),
    syncVersion: Number.isInteger(value.syncVersion) ? value.syncVersion : 1,
    name: value.name.trim(),
    sport: value.sport,
    startDate: value.startDate,
    startDateTime: new Date(value.startDateTime).toISOString(),
    localStartDateTime: value.localStartDateTime,
    startDateLocal: optionalString(value.startDateLocal) ?? value.localStartDateTime,
    timezone: optionalString(value.timezone),
    durationSeconds: Math.round(Number(value.durationSeconds)),
    movingTimeSeconds: optionalNumber(value.movingTimeSeconds),
    elapsedTimeSeconds: optionalNumber(value.elapsedTimeSeconds) ?? Math.round(Number(value.durationSeconds)),
    sportType: optionalString(value.sportType),
    workoutType: optionalNumber(value.workoutType),
    description: optionalString(value.description),
    distanceMeters: optionalNumber(value.distanceMeters),
    elevationGainMeters: optionalNumber(value.elevationGainMeters),
    averageHeartRate: optionalNumber(value.averageHeartRate),
    hasHeartRate: Boolean(value.hasHeartRate || optionalNumber(value.averageHeartRate)),
    maxHeartRate: optionalNumber(value.maxHeartRate),
    averagePower: optionalNumber(value.averagePower),
    hasPower: Boolean(value.hasPower || optionalNumber(value.averagePower)),
    maxPower: optionalNumber(value.maxPower),
    weightedPower: optionalNumber(value.weightedPower),
    normalizedPower: optionalNumber(value.normalizedPower),
    averageCadence: optionalNumber(value.averageCadence),
    calories: optionalNumber(value.calories),
    kilojoules: optionalNumber(value.kilojoules),
    deviceWatts: Boolean(value.deviceWatts),
    averageSpeed: optionalNumber(value.averageSpeed),
    maxSpeed: optionalNumber(value.maxSpeed),
    temperature: optionalNumber(value.temperature),
    relativeEffort: optionalNumber(value.relativeEffort),
    trainer: Boolean(value.trainer),
    commute: Boolean(value.commute),
    manual: Boolean(value.manual),
    deviceName: typeof value.deviceName === "string" ? value.deviceName : null,
    gearId: optionalString(value.gearId),
    externalUrl: typeof value.externalUrl === "string" && /^https:\/\//.test(value.externalUrl) ? value.externalUrl : null,
    syncedAt: new Date(value.syncedAt).toISOString(),
    rawDataVersion: Number.isInteger(value.rawDataVersion) ? value.rawDataVersion : 1,
    plannedSessionId: typeof value.plannedSessionId === "string" ? value.plannedSessionId : null,
    syncStatus: ["synced", "deleted", "unavailable"].includes(value.syncStatus) ? value.syncStatus : "synced",
    detailSyncStatus: ["summary", "loading", "loaded", "error"].includes(value.detailSyncStatus) ? value.detailSyncStatus : "summary",
    streamSyncStatus: ["not_loaded", "loading", "loaded", "partial", "error"].includes(value.streamSyncStatus) ? value.streamSyncStatus : "not_loaded",
    matchStatus: ["automatic", "probable", "manual_required", "manual", "unmatched"].includes(value.matchStatus) ? value.matchStatus : (value.plannedSessionId ? "automatic" : "unmatched"),
  };
}

export function normalizeActivities(values) {
  if (!Array.isArray(values)) return null;
  const normalized = values.map(normalizeActivity);
  if (normalized.some((item) => !item)) return null;
  const keys = new Set(normalized.map((item) => `${item.provider}:${item.externalId}`));
  return keys.size === normalized.length ? normalized.sort((a, b) => b.startDateTime.localeCompare(a.startDateTime)) : null;
}

export function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function optionalString(value) { return typeof value === "string" && value.trim() ? value.trim() : null; }
