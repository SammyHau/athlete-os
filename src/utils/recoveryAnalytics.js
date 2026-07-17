import { toISODate } from "../data/trainingPlan";
import { addDays, getSessionsInRange } from "./trainingAnalytics";

// Five explainable factors form the complete score; optional biomarkers only refine physical readiness.
export const READINESS_WEIGHTS = {
  sleep: 0.3,
  subjectiveRecovery: 0.25,
  stress: 0.15,
  physicalReadiness: 0.15,
  trainingLoad: 0.15,
};

// Duration is the base load. These multipliers approximate metabolic and musculoskeletal demand without RPE data.
export const LOAD_WEIGHTS = {
  intensity: { "Sehr locker": 0.55, Locker: 0.75, Moderat: 1, Hoch: 1.3 },
  sport: { swim: 0.9, bike: 0.85, run: 1.15, strength: 1.1, mobility: 0.45, recovery: 0.35 },
};

export const MINIMUM_BASELINE_VALUES = 7;

export function estimateSessionLoad(session) {
  if (session?.status !== "completed") return 0;
  const duration = Number.isFinite(session.durationMinutes) ? session.durationMinutes : 0;
  const intensity = LOAD_WEIGHTS.intensity[session.intensity] ?? 1;
  const sport = LOAD_WEIGHTS.sport[session.sport] ?? 1;
  return Math.max(0, Math.round(duration * intensity * sport));
}

export function getEstimatedLoad(sessions, referenceDate = new Date()) {
  const today = toISODate(referenceDate);
  const ranges = {
    today: [today, today],
    last7: [toISODate(addDays(referenceDate, -6)), today],
    previous7: [toISODate(addDays(referenceDate, -13)), toISODate(addDays(referenceDate, -7))],
    last28: [toISODate(addDays(referenceDate, -27)), today],
    recent3: [toISODate(addDays(referenceDate, -2)), today],
  };
  const sumRange = ([start, end]) => getSessionsInRange(sessions, start, end)
    .reduce((sum, session) => sum + estimateSessionLoad(session), 0);
  const todayLoad = sumRange(ranges.today);
  const last7 = sumRange(ranges.last7);
  const previous7 = sumRange(ranges.previous7);
  const last28 = sumRange(ranges.last28);
  const recent3 = sumRange(ranges.recent3);
  const longTermWeeklyAverage = last28 / 4;
  const ratio = longTermWeeklyAverage > 0 ? last7 / longTermWeeklyAverage : null;
  const trend = last7 > previous7 * 1.1 ? "steigend" : last7 < previous7 * 0.9 ? "sinkend" : "stabil";
  return { today: todayLoad, last7, previous7, last28, recent3, ratio, trend };
}

export function calculateReadiness(checkIn, checkIns, sessions, settings) {
  if (!checkIn) return null;
  const sleepGoal = settings?.sleepGoalMinutes || 450;
  const durationScore = Math.min(100, (checkIn.sleepDurationMinutes / sleepGoal) * 100);
  const sleep = Math.round(durationScore * 0.6 + ratingToScore(checkIn.sleepQuality) * 0.4);
  const subjectiveRecovery = Math.round(
    (ratingToScore(checkIn.energy) + ratingToScore(checkIn.motivation)) / 2,
  );
  const stress = inverseRatingToScore(checkIn.stress);
  const baselines = getPersonalBaselines(checkIns, checkIn.date);
  const biomarkerScores = [];
  if (settings?.useRestingHeartRateBaseline !== false && baselines.restingHeartRate && checkIn.restingHeartRate) {
    biomarkerScores.push(relativeBiomarkerScore(checkIn.restingHeartRate, baselines.restingHeartRate, false));
  }
  if (settings?.useHrvBaseline !== false && baselines.hrv && checkIn.hrv) {
    biomarkerScores.push(relativeBiomarkerScore(checkIn.hrv, baselines.hrv, true));
  }
  const sorenessScore = inverseRatingToScore(checkIn.soreness);
  const physicalReadiness = biomarkerScores.length
    ? Math.round(sorenessScore * 0.6 + average(biomarkerScores) * 0.4)
    : sorenessScore;
  const load = getEstimatedLoad(sessions, new Date(`${checkIn.date}T12:00:00`));
  const dailyBaseline = load.last28 > 0 ? load.last28 / 28 : 0;
  const trainingLoad = dailyBaseline > 0
    ? clamp(Math.round(100 - Math.max(0, load.recent3 / (dailyBaseline * 3) - 0.75) * 45), 20, 100)
    : 100;
  const factors = { sleep, subjectiveRecovery, stress, physicalReadiness, trainingLoad };
  const score = clamp(Math.round(Object.entries(READINESS_WEIGHTS)
    .reduce((sum, [key, weight]) => sum + factors[key] * weight, 0)), 0, 100);
  const limitingFactor = Object.entries(factors).sort((a, b) => a[1] - b[1])[0][0];
  return {
    score,
    status: getReadinessStatus(score),
    factors,
    limitingFactor,
    recommendation: getRecommendation(limitingFactor),
    baselines,
    load,
  };
}

export function getReadinessStatus(score) {
  if (score >= 80) return { label: "Sehr bereit", tone: "success" };
  if (score >= 65) return { label: "Bereit", tone: "accent" };
  if (score >= 45) return { label: "Moderat", tone: "warning" };
  return { label: "Erholung priorisieren", tone: "danger" };
}

export function getPersonalBaselines(checkIns, beforeDate) {
  const previous = checkIns.filter((item) => item.date < beforeDate);
  return {
    restingHeartRate: baseline(previous.map((item) => item.restingHeartRate).filter(Boolean)),
    hrv: baseline(previous.map((item) => item.hrv).filter(Boolean)),
  };
}

export function getRecoveryHistory(checkIns, sessions, settings, days = 7, referenceDate = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(referenceDate, index - (days - 1));
    const isoDate = toISODate(date);
    const checkIn = checkIns.find((item) => item.date === isoDate) ?? null;
    return { date: isoDate, checkIn, readiness: calculateReadiness(checkIn, checkIns, sessions, settings) };
  });
}

export function summarizeRecovery(history) {
  const completed = history.filter((item) => item.checkIn);
  if (!completed.length) return { count: 0, averageSleepMinutes: 0, averageSleepQuality: 0, averageStress: 0 };
  return {
    count: completed.length,
    averageSleepMinutes: Math.round(average(completed.map((item) => item.checkIn.sleepDurationMinutes))),
    averageSleepQuality: roundOne(average(completed.map((item) => item.checkIn.sleepQuality))),
    averageStress: roundOne(average(completed.map((item) => item.checkIn.stress))),
  };
}

export function getLoadReadinessDescription(history, sessions, referenceDate = new Date()) {
  const scored = history.filter((item) => item.readiness);
  if (scored.length < 4) return null;
  const load = getEstimatedLoad(sessions, referenceDate);
  const averageReadiness = Math.round(average(scored.map((item) => item.readiness.score)));
  return `Bei einer geschätzten 7-Tage-Belastung von ${load.last7} lag deine mittlere Readiness bei ${averageReadiness}. Das beschreibt nur den aktuellen Verlauf.`;
}

function ratingToScore(value) { return clamp((value - 1) * 25, 0, 100); }
function inverseRatingToScore(value) { return clamp((5 - value) * 25, 0, 100); }
function baseline(values) { return values.length >= MINIMUM_BASELINE_VALUES ? roundOne(average(values.slice(-28))) : null; }
function relativeBiomarkerScore(value, personalBaseline, higherIsBetter) {
  const difference = ((value - personalBaseline) / personalBaseline) * 100 * (higherIsBetter ? 1 : -1);
  return clamp(Math.round(75 + difference * 2.5), 25, 100);
}
function average(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function roundOne(value) { return Math.round(value * 10) / 10; }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function getRecommendation(key) {
  return {
    sleep: "Schlaf ist heute der wichtigste Hebel.",
    subjectiveRecovery: "Energie und Motivation sprechen für einen kontrollierten Tag.",
    stress: "Plane heute bewusst ruhige Phasen ein.",
    physicalReadiness: "Körperliche Signale sprechen für reduzierte Intensität.",
    trainingLoad: "Die jüngste Belastung spricht für dosiertes Training.",
  }[key];
}
