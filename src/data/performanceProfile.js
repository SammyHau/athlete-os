export const PERFORMANCE_PROFILE_VERSION = 1;

export function createEmptyPerformanceProfile() {
  return { version: PERFORMANCE_PROFILE_VERSION, run: { fiveKmSeconds: null, tenKmSeconds: null, halfMarathonSeconds: null, thresholdPaceSecondsPerKm: null, thresholdHeartRate: null, maxHeartRate: null, paceUnit: "min/km" }, bike: { ftpWatts: null, thresholdHeartRate: null, maxHeartRate: null }, swim: { cssSecondsPer100m: null, test400mSeconds: null, test200mSeconds: null }, overrides: {}, metadata: {} };
}

export function normalizePerformanceProfile(value) {
  const empty = createEmptyPerformanceProfile();
  if (!value || typeof value !== "object") return empty;
  return { ...empty, ...value, run: normalizeSection(empty.run, value.run), bike: normalizeSection(empty.bike, value.bike), swim: normalizeSection(empty.swim, value.swim), overrides: value.overrides && typeof value.overrides === "object" ? value.overrides : {}, metadata: value.metadata && typeof value.metadata === "object" ? value.metadata : {} };
}

export function setPerformanceMetric(profile, section, field, value, source = "manual") {
  const number = value === "" || value === null ? null : Number(value);
  if (number !== null && (!Number.isFinite(number) || number <= 0)) return null;
  const next = normalizePerformanceProfile(profile);
  return { ...next, [section]: { ...next[section], [field]: number }, metadata: { ...next.metadata, [`${section}.${field}`]: { source, determinedAt: new Date().toISOString(), confirmed: source === "manual", stale: false } } };
}

function normalizeSection(defaults, value) { const source = value && typeof value === "object" ? value : {}; return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => { const candidate = source[key]; if (typeof fallback === "string") return [key, typeof candidate === "string" ? candidate : fallback]; const number = candidate === null || candidate === undefined ? null : Number(candidate); return [key, Number.isFinite(number) && number > 0 ? number : null]; })); }

export function suggestPerformanceMetrics(activities) {
  const eligibleRuns = activities.filter((activity) => activity.sport === "run" && activity.distanceMeters >= 4000 && activity.distanceMeters <= 20000 && (activity.movingTimeSeconds ?? activity.durationSeconds) > 1200);
  if (eligibleRuns.length < 3) return [];
  const paces = eligibleRuns.slice(0, 8).map((activity) => (activity.movingTimeSeconds ?? activity.durationSeconds) / (activity.distanceMeters / 1000)).filter(Number.isFinite).sort((a, b) => a - b);
  if (paces.length < 3) return [];
  const candidate = Math.round(paces[Math.floor(paces.length / 2)]);
  return [{ section: "run", field: "thresholdPaceSecondsPerKm", value: candidate, source: "estimated_from_activities", message: `Aus deinen letzten Läufen könnte eine Schwellenpace von ${Math.floor(candidate / 60)}:${String(candidate % 60).padStart(2, "0")} min/km sinnvoll sein. Bestätige oder bearbeite diesen Wert.` }];
}
