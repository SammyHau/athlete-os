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
    name: value.name.trim(),
    sport: value.sport,
    startDate: value.startDate,
    startDateTime: new Date(value.startDateTime).toISOString(),
    localStartDateTime: value.localStartDateTime,
    durationSeconds: Math.round(Number(value.durationSeconds)),
    movingTimeSeconds: optionalNumber(value.movingTimeSeconds),
    distanceMeters: optionalNumber(value.distanceMeters),
    elevationGainMeters: optionalNumber(value.elevationGainMeters),
    averageHeartRate: optionalNumber(value.averageHeartRate),
    maxHeartRate: optionalNumber(value.maxHeartRate),
    averagePower: optionalNumber(value.averagePower),
    weightedPower: optionalNumber(value.weightedPower),
    normalizedPower: optionalNumber(value.normalizedPower),
    averageCadence: optionalNumber(value.averageCadence),
    calories: optionalNumber(value.calories),
    trainer: Boolean(value.trainer),
    commute: Boolean(value.commute),
    manual: Boolean(value.manual),
    deviceName: typeof value.deviceName === "string" ? value.deviceName : null,
    externalUrl: typeof value.externalUrl === "string" && /^https:\/\//.test(value.externalUrl) ? value.externalUrl : null,
    syncedAt: new Date(value.syncedAt).toISOString(),
    rawDataVersion: Number.isInteger(value.rawDataVersion) ? value.rawDataVersion : 1,
    plannedSessionId: typeof value.plannedSessionId === "string" ? value.plannedSessionId : null,
    syncStatus: ["synced", "deleted", "unavailable"].includes(value.syncStatus) ? value.syncStatus : "synced",
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
