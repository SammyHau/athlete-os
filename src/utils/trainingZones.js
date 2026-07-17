export function deriveTrainingZones(profile) {
  return {
    runPace: paceZones(profile.run?.thresholdPaceSecondsPerKm, [1.29, 1.14, 1.06, 0.99, 0.9], "s/km"),
    runHeartRate: thresholdZones(profile.run?.thresholdHeartRate, [0.85, 0.9, 0.95, 1, 1.06], "bpm"),
    bikePower: thresholdZones(profile.bike?.ftpWatts, [0.55, 0.75, 0.9, 1.05, 1.2], "W"),
    bikeHeartRate: thresholdZones(profile.bike?.thresholdHeartRate, [0.81, 0.89, 0.93, 0.99, 1.06], "bpm"),
    swimPace: paceZones(profile.swim?.cssSecondsPer100m, [1.18, 1.1, 1.04, 0.99, 0.94], "s/100m"),
    rpe: [{ zone: 1, min: 1, max: 2 }, { zone: 2, min: 3, max: 4 }, { zone: 3, min: 5, max: 6 }, { zone: 4, min: 7, max: 8 }, { zone: 5, min: 9, max: 10 }],
  };
}

export function getPrescriptionAvailability(profile) { return { pace: Boolean(profile.run?.thresholdPaceSecondsPerKm), runHeartRate: Boolean(profile.run?.thresholdHeartRate), power: Boolean(profile.bike?.ftpWatts), bikeHeartRate: Boolean(profile.bike?.thresholdHeartRate), swimPace: Boolean(profile.swim?.cssSecondsPer100m) }; }

function thresholdZones(value, upperFactors, unit) { if (!Number.isFinite(value)) return null; let previous = 0; return upperFactors.map((factor, index) => { const max = Math.round(value * factor); const zone = { zone: index + 1, min: previous || null, max, unit }; previous = max + 1; return zone; }); }
function paceZones(value, factors, unit) { if (!Number.isFinite(value)) return null; return factors.map((factor, index) => ({ zone: index + 1, target: Math.round(value * factor), unit })); }
