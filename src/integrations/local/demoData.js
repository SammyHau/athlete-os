import { toISODate } from "../../data/trainingPlan";
import { addDays } from "../../utils/trainingAnalytics";

export function createDemoActivities(referenceDate = new Date()) {
  const syncedAt = referenceDate.toISOString();
  return [
    demo("demo-run-1", "Morgenlauf am Maschsee", "run", addDays(referenceDate, -1), 47, { distanceMeters: 9120, averageHeartRate: 148, maxHeartRate: 169, averageCadence: 172 }, syncedAt),
    demo("demo-bike-1", "Grundlage auf dem Rad", "bike", addDays(referenceDate, -3), 96, { distanceMeters: 42100, elevationGainMeters: 310, averagePower: 178, weightedPower: 192, averageHeartRate: 137, trainer: false }, syncedAt),
    demo("demo-swim-1", "Ausdauer im Becken", "swim", addDays(referenceDate, -5), 58, { distanceMeters: 2800, averageHeartRate: null }, syncedAt),
  ];
}

function demo(externalId, name, sport, date, minutes, metrics, syncedAt) {
  const day = toISODate(date);
  return {
    id: `local:${externalId}`, externalId, provider: "local", name, sport, startDate: day,
    startDateTime: `${day}T07:00:00.000Z`, localStartDateTime: `${day}T08:00:00`,
    durationSeconds: minutes * 60, movingTimeSeconds: (minutes - 2) * 60, distanceMeters: null,
    elevationGainMeters: null, averageHeartRate: null, maxHeartRate: null, averagePower: null,
    weightedPower: null, normalizedPower: null, averageCadence: null, calories: null,
    trainer: false, commute: false, manual: false, deviceName: "AthleteOS Demo-Gerät",
    externalUrl: null, syncedAt, rawDataVersion: 1, plannedSessionId: null, syncStatus: "synced", ...metrics,
  };
}
