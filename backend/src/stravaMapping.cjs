const SPORT_MAP = {
  Run: "run", TrailRun: "run", VirtualRun: "run",
  Ride: "bike", MountainBikeRide: "bike", GravelRide: "bike", VirtualRide: "bike", EBikeRide: "bike",
  Swim: "swim", WeightTraining: "strength", Workout: "strength",
  Walk: "walk", Hike: "hike",
};

function normalizeStravaActivity(value, syncedAt = new Date().toISOString()) {
  if (!value || (!Number.isFinite(Number(value.id)) && typeof value.id !== "string") || typeof value.name !== "string" || !Number.isFinite(Date.parse(value.start_date))) return null;
  const externalId = String(value.id);
  const localStart = typeof value.start_date_local === "string" && Number.isFinite(Date.parse(value.start_date_local)) ? value.start_date_local : value.start_date;
  return {
    id: `strava:${externalId}`,
    externalId,
    provider: "strava",
    name: value.name.trim() || "Strava-Aktivität",
    sport: SPORT_MAP[value.sport_type] ?? SPORT_MAP[value.type] ?? "other",
    startDate: localStart.slice(0, 10),
    startDateTime: value.start_date,
    localStartDateTime: localStart,
    durationSeconds: optionalNumber(value.elapsed_time) ?? 0,
    movingTimeSeconds: optionalNumber(value.moving_time),
    distanceMeters: optionalNumber(value.distance),
    elevationGainMeters: optionalNumber(value.total_elevation_gain),
    averageHeartRate: optionalNumber(value.average_heartrate),
    maxHeartRate: optionalNumber(value.max_heartrate),
    averagePower: optionalNumber(value.average_watts),
    weightedPower: optionalNumber(value.weighted_average_watts),
    normalizedPower: optionalNumber(value.normalized_power),
    averageCadence: optionalNumber(value.average_cadence),
    calories: optionalNumber(value.calories),
    trainer: Boolean(value.trainer),
    commute: Boolean(value.commute),
    manual: Boolean(value.manual),
    deviceName: typeof value.device_name === "string" ? value.device_name : null,
    externalUrl: `https://www.strava.com/activities/${externalId}`,
    syncedAt,
    rawDataVersion: 1,
    plannedSessionId: null,
    syncStatus: "synced",
  };
}

function optionalNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }

module.exports = { SPORT_MAP, normalizeStravaActivity };
