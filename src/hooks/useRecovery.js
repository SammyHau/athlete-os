import { useCallback, useEffect, useRef, useState } from "react";

import {
  defaultRecoverySettings,
  normalizeRecoverySettings,
  removeRecoveryCheckIn,
  upsertRecoveryCheckIn,
} from "../data/recovery";
import { loadRecoveryData, resetRecoveryData, saveRecoveryData } from "../services/recoveryStorage";

export function useRecoveryState() {
  const [checkIns, setCheckIns] = useState([]);
  const [settings, setSettings] = useState(defaultRecoverySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const stateRef = useRef({ checkIns: [], settings: defaultRecoverySettings });
  const queue = useRef(Promise.resolve());

  const reloadRecovery = useCallback(async () => {
    setIsLoading(true);
    const result = await loadRecoveryData();
    if (result.status === "invalid") {
      try {
        await resetRecoveryData();
      } catch (resetError) {
        console.error("Beschädigte Recovery-Daten konnten nicht entfernt werden.", resetError);
      }
    }
    const next = { checkIns: result.checkIns, settings: result.settings };
    stateRef.current = next;
    setCheckIns(next.checkIns);
    setSettings(next.settings);
    setError(result.status === "invalid"
      ? "Gespeicherte Recovery-Daten waren beschädigt und wurden zurückgesetzt."
      : result.status === "error" ? "Recovery-Daten konnten nicht gelesen werden." : null);
    setIsLoading(false);
  }, []);

  useEffect(() => { reloadRecovery(); }, [reloadRecovery]);

  const commit = useCallback((next) => {
    stateRef.current = next;
    setCheckIns(next.checkIns);
    setSettings(next.settings);
    setError(null);
    queue.current = queue.current.catch(() => undefined)
      .then(() => saveRecoveryData(next.checkIns, next.settings))
      .catch((saveError) => {
        console.error("Recovery-Änderungen konnten nicht gespeichert werden.", saveError);
        setError("Recovery-Änderungen konnten nicht lokal gespeichert werden.");
      });
  }, []);

  const saveCheckIn = useCallback((draft) => {
    const nextCheckIns = upsertRecoveryCheckIn(stateRef.current.checkIns, draft);
    if (!nextCheckIns) return false;
    commit({ ...stateRef.current, checkIns: nextCheckIns });
    return true;
  }, [commit]);

  const deleteCheckIn = useCallback((id) => {
    commit({ ...stateRef.current, checkIns: removeRecoveryCheckIn(stateRef.current.checkIns, id) });
  }, [commit]);

  const updateSettings = useCallback((changes) => {
    const nextSettings = normalizeRecoverySettings({ ...stateRef.current.settings, ...changes });
    if (!nextSettings) return false;
    commit({ ...stateRef.current, settings: nextSettings });
    return true;
  }, [commit]);

  const resetRecovery = useCallback(async () => {
    try {
      await queue.current.catch(() => undefined);
      await resetRecoveryData();
      const next = { checkIns: [], settings: defaultRecoverySettings };
      stateRef.current = next;
      setCheckIns([]);
      setSettings(defaultRecoverySettings);
      setError(null);
    } catch (resetError) {
      console.error("Recovery-Daten konnten nicht zurückgesetzt werden.", resetError);
      setError("Recovery-Daten konnten nicht zurückgesetzt werden.");
    }
  }, []);

  return { checkIns, settings, isLoading, error, saveCheckIn, deleteCheckIn, updateSettings, resetRecovery, reloadRecovery };
}
