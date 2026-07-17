import AsyncStorage from "@react-native-async-storage/async-storage";

import { normalizeTrainingSessions } from "../data/trainingPlan";

export const TRAINING_STORAGE_KEY = "athleteos.trainingPlan.v1";
export const TRAINING_STORAGE_VERSION = 1;

export async function loadTrainingSessions() {
  try {
    const storedValue = await AsyncStorage.getItem(TRAINING_STORAGE_KEY);
    if (storedValue === null) {
      return { status: "empty", sessions: null };
    }

    const payload = JSON.parse(storedValue);
    if (payload?.version !== TRAINING_STORAGE_VERSION) {
      console.warn("Unbekannte Trainingsdaten-Version. Demo-Daten werden verwendet.");
      return { status: "invalid", sessions: null };
    }

    const sessions = normalizeTrainingSessions(payload.sessions);
    if (!sessions) {
      console.warn("Gespeicherte Trainingsdaten sind ungültig. Demo-Daten werden verwendet.");
      return { status: "invalid", sessions: null };
    }

    return { status: "loaded", sessions };
  } catch (error) {
    console.error("Trainingsdaten konnten nicht geladen werden.", error);
    return { status: "error", sessions: null };
  }
}

export async function saveTrainingSessions(sessions) {
  const normalizedSessions = normalizeTrainingSessions(sessions);
  if (!normalizedSessions) {
    throw new Error("Ungültige Trainingsdaten werden nicht gespeichert.");
  }

  const payload = {
    version: TRAINING_STORAGE_VERSION,
    sessions: normalizedSessions,
  };
  await AsyncStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(payload));
}

export async function resetTrainingSessions() {
  await AsyncStorage.removeItem(TRAINING_STORAGE_KEY);
}
