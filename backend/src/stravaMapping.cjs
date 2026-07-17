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
    athleteId: value.athlete?.id ? String(value.athlete.id) : null,
    source: "Strava",
    syncVersion: 2,
    name: value.name.trim() || "Strava-Aktivität",
    sport: SPORT_MAP[value.sport_type] ?? SPORT_MAP[value.type] ?? "other",
    startDate: localStart.slice(0, 10),
    startDateTime: value.start_date,
    localStartDateTime: localStart,
    startDateLocal: localStart,
    timezone: typeof value.timezone === "string" ? value.timezone : null,
    durationSeconds: optionalNumber(value.elapsed_time) ?? 0,
    movingTimeSeconds: optionalNumber(value.moving_time),
    elapsedTimeSeconds: optionalNumber(value.elapsed_time),
    sportType: typeof value.sport_type === "string" ? value.sport_type : null,
    workoutType: optionalNumber(value.workout_type),
    description: typeof value.description === "string" ? value.description : null,
    distanceMeters: optionalNumber(value.distance),
    elevationGainMeters: optionalNumber(value.total_elevation_gain),
    averageHeartRate: optionalNumber(value.average_heartrate),
    hasHeartRate: Boolean(value.has_heartrate || optionalNumber(value.average_heartrate)),
    maxHeartRate: optionalNumber(value.max_heartrate),
    averagePower: optionalNumber(value.average_watts),
    hasPower: Boolean(value.device_watts || optionalNumber(value.average_watts)),
    maxPower: optionalNumber(value.max_watts),
    weightedPower: optionalNumber(value.weighted_average_watts),
    normalizedPower: optionalNumber(value.normalized_power),
    averageCadence: optionalNumber(value.average_cadence),
    calories: optionalNumber(value.calories),
    kilojoules: optionalNumber(value.kilojoules),
    deviceWatts: value.device_watts === true,
    averageSpeed: optionalNumber(value.average_speed),
    maxSpeed: optionalNumber(value.max_speed),
    temperature: optionalNumber(value.average_temp),
    relativeEffort: optionalNumber(value.suffer_score),
    trainer: Boolean(value.trainer),
    commute: Boolean(value.commute),
    manual: Boolean(value.manual),
    deviceName: typeof value.device_name === "string" ? value.device_name : null,
    gearId: typeof value.gear_id === "string" ? value.gear_id : null,
    externalUrl: `https://www.strava.com/activities/${externalId}`,
    syncedAt,
    rawDataVersion: 2,
    detailSyncStatus: "summary",
    streamSyncStatus: "not_loaded",
    plannedSessionId: null,
    syncStatus: "synced",
  };
}

function normalizeStravaActivityDetail(value, zones, syncedAt = new Date().toISOString()) {
  const summary = normalizeStravaActivity(value, syncedAt);
  if (!summary) return null;
  return {
    ...summary,
    detailSyncStatus: "loaded",
    detailCachedAt: syncedAt,
    laps: normalizeCollection(value.laps),
    splitsMetric: normalizeCollection(value.splits_metric),
    splitsStandard: normalizeCollection(value.splits_standard),
    bestEfforts: normalizeCollection(value.best_efforts),
    segmentEfforts: normalizeCollection(value.segment_efforts),
    heartRateZones: normalizeZones(zones, "heartrate"),
    powerZones: normalizeZones(zones, "power"),
    mapSummary: typeof value.map?.summary_polyline === "string" ? { available: true } : null,
  };
}

function normalizeCollection(values) { return Array.isArray(values) ? values.map((item) => ({ name: typeof item.name === "string" ? item.name : null, distanceMeters: optionalNumber(item.distance), elapsedTimeSeconds: optionalNumber(item.elapsed_time), movingTimeSeconds: optionalNumber(item.moving_time), averageSpeed: optionalNumber(item.average_speed), averageHeartRate: optionalNumber(item.average_heartrate), averagePower: optionalNumber(item.average_watts), lapIndex: optionalNumber(item.lap_index), split: optionalNumber(item.split) })) : []; }
function normalizeZones(zones, type) { const match = Array.isArray(zones) ? zones.find((zone) => zone.type === type) : null; return Array.isArray(match?.distribution_buckets) ? match.distribution_buckets.map((bucket, index) => ({ zone: index + 1, min: optionalNumber(bucket.min), max: optionalNumber(bucket.max), timeSeconds: optionalNumber(bucket.time) })) : null; }

function optionalNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }

module.exports = { SPORT_MAP, normalizeStravaActivity, normalizeStravaActivityDetail };
