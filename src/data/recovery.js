import { isISODate, toISODate } from "./trainingPlan";

export const recoverySources = ["manual", "garmin", "imported"];
export const ratingFields = [
  "sleepQuality",
  "soreness",
  "stress",
  "energy",
  "motivation",
];

export const defaultRecoverySettings = {
  sleepGoalMinutes: 450,
  useRestingHeartRateBaseline: true,
  useHrvBaseline: true,
};

export function createRecoveryDraft(date = toISODate(new Date())) {
  return {
    date,
    sleepDurationMinutes: 450,
    sleepQuality: 3,
    soreness: 3,
    stress: 3,
    energy: 3,
    motivation: 3,
    restingHeartRate: "",
    hrv: "",
    notes: "",
    source: "manual",
  };
}

export function validateRecoveryDraft(value) {
  const errors = {};
  if (!isISODate(value?.date)) errors.date = "Das Datum ist ungültig.";
  if (!isIntegerInRange(Number(value?.sleepDurationMinutes), 0, 1440)) {
    errors.sleepDurationMinutes = "Bitte eine Schlafdauer zwischen 0 und 24 Stunden eingeben.";
  }
  ratingFields.forEach((field) => {
    if (!isIntegerInRange(Number(value?.[field]), 1, 5)) {
      errors[field] = "Bitte einen Wert zwischen 1 und 5 wählen.";
    }
  });
  if (!isOptionalNumber(value?.restingHeartRate, 25, 240)) {
    errors.restingHeartRate = "Der Ruhepuls muss zwischen 25 und 240 liegen.";
  }
  if (!isOptionalNumber(value?.hrv, 1, 300)) {
    errors.hrv = "Die HRV muss zwischen 1 und 300 liegen.";
  }
  return errors;
}

export function normalizeRecoveryCheckIn(value) {
  if (!value || typeof value !== "object" || Object.keys(validateRecoveryDraft(value)).length) {
    return null;
  }
  if (typeof value.id !== "string" || !value.id.trim()) return null;
  const createdAt = normalizeTimestamp(value.createdAt);
  const updatedAt = normalizeTimestamp(value.updatedAt);
  if (!createdAt || !updatedAt) return null;

  return {
    id: value.id.trim(),
    date: value.date,
    sleepDurationMinutes: Math.round(Number(value.sleepDurationMinutes)),
    sleepQuality: Number(value.sleepQuality),
    soreness: Number(value.soreness),
    stress: Number(value.stress),
    energy: Number(value.energy),
    motivation: Number(value.motivation),
    restingHeartRate: optionalNumber(value.restingHeartRate),
    hrv: optionalNumber(value.hrv),
    notes: typeof value.notes === "string" ? value.notes.trim() : "",
    source: recoverySources.includes(value.source) ? value.source : "manual",
    createdAt,
    updatedAt,
  };
}

export function normalizeRecoveryCheckIns(values) {
  if (!Array.isArray(values)) return null;
  const normalized = values.map(normalizeRecoveryCheckIn);
  if (normalized.some((item) => !item)) return null;
  const dates = new Set(normalized.map((item) => item.date));
  const ids = new Set(normalized.map((item) => item.id));
  if (dates.size !== normalized.length || ids.size !== normalized.length) return null;
  return normalized.slice().sort((left, right) => left.date.localeCompare(right.date));
}

export function normalizeRecoverySettings(value) {
  if (!value || typeof value !== "object") return null;
  const sleepGoalMinutes = Math.round(Number(value.sleepGoalMinutes));
  if (!isIntegerInRange(sleepGoalMinutes, 240, 720)) return null;
  return {
    sleepGoalMinutes,
    useRestingHeartRateBaseline: value.useRestingHeartRateBaseline !== false,
    useHrvBaseline: value.useHrvBaseline !== false,
  };
}

export function upsertRecoveryCheckIn(checkIns, draft, now = new Date()) {
  if (Object.keys(validateRecoveryDraft(draft)).length) return null;
  const existing = checkIns.find((item) => item.date === draft.date);
  const timestamp = now.toISOString();
  const candidate = normalizeRecoveryCheckIn({
    ...draft,
    id: existing?.id ?? `recovery-${draft.date}`,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
  if (!candidate) return null;
  return [...checkIns.filter((item) => item.date !== candidate.date), candidate]
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function removeRecoveryCheckIn(checkIns, id) {
  return checkIns.filter((item) => item.id !== id);
}

function optionalNumber(value) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}

function isOptionalNumber(value, minimum, maximum) {
  if (value === "" || value === null || value === undefined) return true;
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum;
}

function isIntegerInRange(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function normalizeTimestamp(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
