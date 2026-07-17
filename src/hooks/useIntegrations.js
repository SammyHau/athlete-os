import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Linking from "expo-linking";

import { integrationApiUrl, integrationMode } from "../integrations/integrationConfig";
import { assertIntegrationProvider } from "../integrations/providerContract";
import { createConfiguredProvider } from "../integrations/providerFactory";
import { integrationRequest } from "../integrations/strava/stravaApi";
import { parseStravaCallback } from "../integrations/strava/oauthCallback";
import { reconcileActivities } from "../services/activityRepository";
import { linkActivity } from "../utils/activityMatching";
import { loadActivities, saveActivities } from "../services/activityStorage";
import { loadActivityDetail, resetActivityDetails, saveActivityDetail } from "../services/activityDetailStorage";

export function useIntegrationsState(sessions) {
  const provider = useMemo(() => assertIntegrationProvider(createConfiguredProvider()), []);
  const [activities, setActivities] = useState([]);
  const [connection, setConnection] = useState({ connected: false, demo: provider.demo });
  const [status, setStatus] = useState("loading");
  const [lastSync, setLastSync] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendReachable, setBackendReachable] = useState(null);
  const [syncState, setSyncState] = useState(null);
  const [activityDetails, setActivityDetails] = useState({});
  const [detailErrors, setDetailErrors] = useState({});
  const activitiesRef = useRef([]);
  const detailRequests = useRef(new Map());

  const refreshStatus = useCallback(async () => {
    try {
      const next = await provider.getConnectionStatus();
      setConnection(next);
      if (next.connected) provider.getLastSync().then(setSyncState).catch(() => undefined);
      setStatus(next.connected ? "connected" : "disconnected");
      setError(null);
    } catch (statusError) {
      setStatus(statusError.code === "connection_expired" ? "expired" : "error");
      setError(statusError.message);
    }
  }, [provider]);

  useEffect(() => {
    let active = true;
    loadActivities().then((stored) => {
      if (!active) return;
      activitiesRef.current = stored.activities;
      setActivities(stored.activities);
      setLastSync(stored.lastSync);
      if (stored.status === "invalid") setError("Gespeicherte Aktivitätsdaten waren beschädigt und wurden verworfen.");
      refreshStatus();
    });
    return () => { active = false; };
  }, [refreshStatus]);

  useEffect(() => {
    if (integrationMode !== "strava" || !integrationApiUrl) {
      setBackendReachable(false);
      return;
    }
    let active = true;
    integrationRequest("/health")
      .then(() => { if (active) setBackendReachable(true); })
      .catch(() => { if (active) setBackendReachable(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (provider.demo) return undefined;
    function handleCallback(url) {
      const result = parseStravaCallback(url);
      if (!result) return;
      if (result === "connected") refreshStatus();
      else {
        setConnection({ connected: false, demo: false });
        setStatus(result === "cancelled" ? "disconnected" : "error");
        setError(result === "cancelled" ? "Strava-Verbindung wurde abgebrochen." : "Strava-Verbindung konnte nicht hergestellt werden.");
      }
    }
    Linking.getInitialURL().then((url) => { if (url) handleCallback(url); });
    const subscription = Linking.addEventListener("url", ({ url }) => handleCallback(url));
    return () => subscription.remove();
  }, [provider.demo, refreshStatus]);

  const connect = useCallback(async (includePrivate = false) => {
    setStatus("connecting"); setError(null);
    try {
      await provider.connect(includePrivate === true);
    } catch (connectError) { setStatus("error"); setError(connectError.message); }
  }, [provider]);

  const disconnect = useCallback(async () => {
    try {
      await provider.disconnect();
      const remaining = activitiesRef.current.filter((item) => item.provider !== provider.id);
      await saveActivities(remaining, null);
      activitiesRef.current = remaining;
      setActivities(remaining); setLastSync(null); setLastResult(null); setConnection({ connected: false, demo: provider.demo }); setStatus("disconnected"); setError(null);
    } catch (disconnectError) { setStatus("error"); setError(disconnectError.message); }
  }, [provider]);

  const syncActivities = useCallback(async () => {
    setStatus("syncing"); setError(null);
    try {
      const remote = await provider.syncActivities();
      const reconciled = reconcileActivities(activitiesRef.current, remote.activities || [], sessions);
      const syncTime = remote.lastSuccessfulSync || new Date().toISOString();
      await saveActivities(reconciled.activities, syncTime);
      activitiesRef.current = reconciled.activities;
      setActivities(reconciled.activities); setLastSync(syncTime); setLastResult(reconciled); setStatus("synced");
      setSyncState(remote.backfill ?? remote);
      return reconciled;
    } catch (syncError) { setStatus(syncError.code === "connection_expired" ? "expired" : "error"); setError(syncError.message); return null; }
  }, [provider, sessions]);

  const loadActivityDetails = useCallback(async (activity, { streams = false, refresh = false } = {}) => {
    if (!activity || provider.demo) return null;
    const requestKey = `${activity.externalId}:${streams}:${refresh}`;
    if (detailRequests.current.has(requestKey)) return detailRequests.current.get(requestKey);
    const operation = (async () => {
      setDetailErrors((current) => ({ ...current, [activity.id]: null }));
      try {
        const cached = refresh ? null : await loadActivityDetail(activity.id);
        let detail = cached?.detail;
        if (!detail || refresh) detail = await provider.getActivityDetail(activity.externalId, refresh);
        let streamData = cached?.streams ?? null;
        if (streams && (!streamData || refresh)) streamData = await provider.getActivityStreams(activity.externalId, ["time", "distance", "heartrate", "cadence", "watts", "velocity_smooth", "altitude", "moving", "grade_smooth", "temp"], refresh);
        const value = { detail, streams: streamData, cachedAt: new Date().toISOString() };
        await saveActivityDetail(activity.id, value);
        setActivityDetails((current) => ({ ...current, [activity.id]: value }));
        return value;
      } catch (detailError) {
        setDetailErrors((current) => ({ ...current, [activity.id]: detailError.message }));
        return null;
      }
    })().finally(() => detailRequests.current.delete(requestKey));
    detailRequests.current.set(requestKey, operation);
    return operation;
  }, [provider]);

  const deleteImportedActivities = useCallback(async () => {
    await provider.deleteImportedActivities();
    await saveActivities([], null);
    await resetActivityDetails();
    activitiesRef.current = [];
    setActivities([]); setActivityDetails({}); setLastSync(null); setLastResult(null);
  }, [provider]);

  const setActivityMatch = useCallback((activityId, sessionId) => {
    const next = linkActivity(activitiesRef.current, activityId, sessionId, sessionId ? "manual" : "unmatched");
    activitiesRef.current = next; setActivities(next); saveActivities(next, lastSync).catch(() => setError("Die manuelle Zuordnung konnte nicht gespeichert werden."));
  }, [lastSync]);

  const cancelBackfill = useCallback(async () => { try { const next = await provider.cancelBackfill(); setSyncState(next); } catch (cancelError) { setError(cancelError.message); } }, [provider]);

  return {
    providerId: provider.id,
    demo: provider.demo,
    diagnostics: { mode: integrationMode || "nicht konfiguriert", apiUrl: integrationApiUrl || "nicht konfiguriert", backendReachable },
    activities, connection, status, syncState, lastSync, lastResult, error, activityDetails, detailErrors,
    connect, disconnect, syncActivities, refreshStatus, loadActivityDetails, deleteImportedActivities, setActivityMatch, cancelBackfill,
  };
}
