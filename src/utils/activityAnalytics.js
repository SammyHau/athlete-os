export function getActivitiesInRange(activities, startDate, endDate) {
  return activities.filter((item) => item.syncStatus !== "deleted" && item.startDate >= startDate && item.startDate <= endDate);
}

export function summarizeActivities(activities) {
  return {
    count: activities.length,
    durationSeconds: activities.reduce((sum, item) => sum + (item.movingTimeSeconds ?? item.durationSeconds), 0),
    distanceMeters: activities.reduce((sum, item) => sum + (item.distanceMeters ?? 0), 0),
    elevationGainMeters: activities.reduce((sum, item) => sum + (item.elevationGainMeters ?? 0), 0),
    averageHeartRate: averageAvailable(activities.map((item) => item.averageHeartRate)),
    averagePower: averageAvailable(activities.map((item) => item.averagePower)),
  };
}

export function getActivitySportDistribution(activities) {
  return [...new Set(activities.map((item) => item.sport))].map((sport) => {
    const matching = activities.filter((item) => item.sport === sport);
    return { sport, count: matching.length, durationSeconds: summarizeActivities(matching).durationSeconds };
  }).sort((a, b) => b.durationSeconds - a.durationSeconds);
}

export function getAverageRunPace(activities) {
  const runs = activities.filter((item) => item.sport === "run" && item.distanceMeters > 0);
  const distance = runs.reduce((sum, item) => sum + item.distanceMeters, 0);
  if (!distance) return null;
  const seconds = runs.reduce((sum, item) => sum + (item.movingTimeSeconds ?? item.durationSeconds), 0);
  const secondsPerKilometer = Math.round(seconds / (distance / 1000));
  return `${Math.floor(secondsPerKilometer / 60)}:${String(secondsPerKilometer % 60).padStart(2, "0")} min/km`;
}

export function formatActivityDuration(seconds) {
  if (!Number.isFinite(seconds)) return null;
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;
}

export function formatActivityDistance(meters) {
  if (!Number.isFinite(meters) || meters <= 0) return null;
  return meters >= 1000 ? `${(meters / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km` : `${Math.round(meters)} m`;
}

export function getActivitySportLabel(sport) {
  return { run: "Laufen", bike: "Radfahren", swim: "Schwimmen", strength: "Krafttraining", walk: "Spaziergang", hike: "Wandern", other: "Sonstige Aktivität" }[sport] ?? "Sonstige Aktivität";
}

function averageAvailable(values) {
  const available = values.filter(Number.isFinite);
  return available.length ? Math.round(available.reduce((sum, value) => sum + value, 0) / available.length) : null;
}
