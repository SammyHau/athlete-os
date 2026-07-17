export function comparePlannedToActual(session, activity, streams = null) {
  if (!session || !activity) return null;
  const actualDuration = activity.movingTimeSeconds ?? activity.durationSeconds;
  const plannedDuration = session.durationMinutes * 60;
  const volume = ratioScore(actualDuration, plannedDuration);
  const targetSteps = (session.workoutSteps || []).filter((step) => step.targetType !== "none");
  const targetCoverage = calculateTargetCoverage(targetSteps, streams);
  const intensity = intensityScore(session, activity);
  const structure = targetSteps.length ? (streams ? targetCoverage : null) : null;
  const availableSignals = [volume, intensity, targetCoverage, structure].filter(Number.isFinite);
  return {
    volume, intensity, targetRange: targetCoverage, structure,
    completeness: Math.round(Math.min(1, actualDuration / plannedDuration) * 100),
    dataQuality: streams && availableSignals.length >= 4 ? "hoch" : availableSignals.length >= 2 ? "mittel" : "eingeschränkt",
    planned: { durationSeconds: plannedDuration, distanceMeters: session.distanceMeters ?? null },
    actual: { durationSeconds: actualDuration, distanceMeters: activity.distanceMeters ?? null, averageHeartRate: activity.averageHeartRate, averagePower: activity.averagePower },
  };
}

function ratioScore(actual, planned) { if (!Number.isFinite(actual) || !Number.isFinite(planned) || planned <= 0) return null; return Math.round(Math.max(0, 1 - Math.abs(actual - planned) / planned) * 100); }
function intensityScore(session, activity) { const targets = session.workoutSteps || []; const power = targets.filter((step) => step.targetType === "power" && Number.isFinite(step.targetMin) && Number.isFinite(step.targetMax)); if (power.length && Number.isFinite(activity.averagePower)) return inRange(activity.averagePower, power[0]) ? 100 : 50; const heartRate = targets.filter((step) => step.targetType === "heartRate" && Number.isFinite(step.targetMin) && Number.isFinite(step.targetMax)); if (heartRate.length && Number.isFinite(activity.averageHeartRate)) return inRange(activity.averageHeartRate, heartRate[0]) ? 100 : 50; return null; }
function calculateTargetCoverage(steps, streams) { if (!steps.length || !streams?.streams) return null; const step = steps[0]; const key = step.targetType === "power" ? "watts" : step.targetType === "heartRate" ? "heartrate" : null; const values = streams.streams[key]?.data; if (!key || !Array.isArray(values) || !values.length || !Number.isFinite(step.targetMin) || !Number.isFinite(step.targetMax)) return null; return Math.round(values.filter((value) => value >= step.targetMin && value <= step.targetMax).length / values.length * 100); }
function inRange(value, target) { return value >= target.targetMin && value <= target.targetMax; }
