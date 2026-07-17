export function summarizeWorkoutPrescription(session) {
  const steps = session?.workoutSteps || [];
  const target = steps.find((step) => Number.isFinite(step.targetMin) && Number.isFinite(step.targetMax) && step.targetType !== "none");
  if (!target) return null;
  const repetitions = target.repetitions ? `${target.repetitions} × ` : "";
  const duration = target.durationValue ? `${target.durationValue} ${durationUnit(target.durationType)} ` : "";
  const range = `${formatTarget(target.targetMin, target.targetType)}–${formatTarget(target.targetMax, target.targetType)} ${target.unit || targetUnit(target.targetType)}`;
  return `${repetitions}${duration}bei ${range}`.trim();
}
function durationUnit(type) { return { time: "min", distance: "m", repetitions: "Wdh.", open: "" }[type] || ""; }
function targetUnit(type) { return { pace: "min/km", swimPace: "min/100 m", heartRate: "bpm", heartRateZone: "Zone", power: "W", powerZone: "Zone", cadence: "U/min", rpe: "RPE", speed: "km/h" }[type] || ""; }
function formatTarget(value, type) { if (!["pace", "swimPace"].includes(type)) return value; const minutes = Math.floor(value / 60); return `${minutes}:${String(Math.round(value % 60)).padStart(2, "0")}`; }
