import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  defaultRecoverySettings,
  normalizeRecoveryCheckIns,
  normalizeRecoverySettings,
} from "../data/recovery";

export const RECOVERY_STORAGE_KEY = "athleteos.recovery.v1";
export const RECOVERY_STORAGE_VERSION = 1;

export async function loadRecoveryData() {
  try {
    const stored = await AsyncStorage.getItem(RECOVERY_STORAGE_KEY);
    if (stored === null) return { status: "empty", checkIns: [], settings: defaultRecoverySettings };
    let payload;
    try {
      payload = JSON.parse(stored);
    } catch {
      console.warn("Gespeicherte Recovery-Daten sind beschädigt und werden verworfen.");
      return { status: "invalid", checkIns: [], settings: defaultRecoverySettings };
    }
    if (payload?.version !== RECOVERY_STORAGE_VERSION) return { status: "invalid", checkIns: [], settings: defaultRecoverySettings };
    const checkIns = normalizeRecoveryCheckIns(payload.checkIns);
    const settings = normalizeRecoverySettings(payload.settings);
    if (!checkIns || !settings) return { status: "invalid", checkIns: [], settings: defaultRecoverySettings };
    return { status: "loaded", checkIns, settings };
  } catch (error) {
    console.error("Recovery-Daten konnten nicht geladen werden.", error);
    return { status: "error", checkIns: [], settings: defaultRecoverySettings };
  }
}

export async function saveRecoveryData(checkIns, settings) {
  const normalizedCheckIns = normalizeRecoveryCheckIns(checkIns);
  const normalizedSettings = normalizeRecoverySettings(settings);
  if (!normalizedCheckIns || !normalizedSettings) throw new Error("Ungültige Recovery-Daten werden nicht gespeichert.");
  await AsyncStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify({
    version: RECOVERY_STORAGE_VERSION,
    checkIns: normalizedCheckIns,
    settings: normalizedSettings,
  }));
}

export async function resetRecoveryData() {
  await AsyncStorage.removeItem(RECOVERY_STORAGE_KEY);
}
