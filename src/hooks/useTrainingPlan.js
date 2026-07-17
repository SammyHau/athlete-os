import { useCallback, useEffect, useRef, useState } from "react";

import {
  createDemoTrainingPlan,
  createDuplicateDraft,
  insertTrainingSession,
  removeTrainingSession,
  replaceTrainingSession,
  toggleTrainingStatus,
} from "../data/trainingPlan";
import {
  loadTrainingSessions,
  resetTrainingSessions,
  saveTrainingSessions,
} from "../services/trainingStorage";

export function useTrainingPlan() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const saveQueue = useRef(Promise.resolve());
  const sessionsRef = useRef([]);

  const reloadTrainingPlan = useCallback(async () => {
    setIsLoading(true);
    const result = await loadTrainingSessions();
    if (result.status === "invalid") {
      try {
        await resetTrainingSessions();
      } catch (resetError) {
        console.error("Beschädigte Trainingsdaten konnten nicht entfernt werden.", resetError);
      }
    }

    const hydratedSessions = result.status === "loaded"
      ? result.sessions
      : createDemoTrainingPlan();
    sessionsRef.current = hydratedSessions;
    setSessions(hydratedSessions);
    setError(
      result.status === "invalid"
        ? "Gespeicherte Daten waren beschädigt. Demo-Daten wurden geladen."
        : result.status === "error"
          ? "Die lokalen Trainingsdaten konnten nicht gelesen werden."
          : null,
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reloadTrainingPlan();
  }, [reloadTrainingPlan]);

  const persist = useCallback((nextSessions) => {
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(() => saveTrainingSessions(nextSessions))
      .catch((saveError) => {
        console.error("Trainingsänderungen konnten nicht gespeichert werden.", saveError);
        setError("Änderungen konnten nicht lokal gespeichert werden.");
      });
  }, []);

  const commit = useCallback((updater) => {
    const next = updater(sessionsRef.current);
    sessionsRef.current = next;
    setSessions(next);
    persist(next);
  }, [persist]);

  const createSession = useCallback((draft) => {
    const next = insertTrainingSession(sessionsRef.current, draft);
    if (!next) {
      return false;
    }

    commit(() => next);
    return true;
  }, [commit]);

  const updateSession = useCallback((id, changes) => {
    const next = replaceTrainingSession(sessionsRef.current, id, changes);
    if (!next) {
      return false;
    }

    commit(() => next);
    return true;
  }, [commit]);

  const deleteSession = useCallback((id) => {
    commit((current) => removeTrainingSession(current, id));
  }, [commit]);

  const duplicateSession = useCallback((id) => {
    const original = sessions.find((item) => item.id === id);
    if (!original) {
      return null;
    }

    return createDuplicateDraft(original);
  }, [sessions]);

  const toggleSessionStatus = useCallback((id) => {
    commit((current) => toggleTrainingStatus(current, id));
  }, [commit]);

  const reset = useCallback(async () => {
    await saveQueue.current.catch(() => undefined);
    await resetTrainingSessions();
    const demoSessions = createDemoTrainingPlan();
    sessionsRef.current = demoSessions;
    setSessions(demoSessions);
    setError(null);
  }, []);

  return {
    sessions,
    isLoading,
    error,
    createSession,
    updateSession,
    deleteSession,
    duplicateSession,
    toggleSessionStatus,
    resetTrainingPlan: reset,
    reloadTrainingPlan,
  };
}
