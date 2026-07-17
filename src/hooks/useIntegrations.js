import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

import { createLocalProvider } from "../integrations/local/localProvider";
import { assertIntegrationProvider } from "../integrations/providerContract";
import { isStravaApiConfigured } from "../integrations/strava/stravaApi";
import { createStravaProvider } from "../integrations/strava/stravaProvider";
import { reconcileActivities } from "../services/activityRepository";
import { loadActivities, saveActivities } from "../services/activityStorage";

export function useIntegrationsState(sessions) {
  const realMode = process.env.EXPO_PUBLIC_INTEGRATION_MODE === "strava" && isStravaApiConfigured();
  const provider = useMemo(() => assertIntegrationProvider(realMode ? createStravaProvider() : createLocalProvider()), [realMode]);
  const [activities, setActivities] = useState([]);
  const [connection, setConnection] = useState({ connected: false, demo: provider.demo });
  const [status, setStatus] = useState("loading");
  const [lastSync, setLastSync] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const activitiesRef = useRef([]);

  const refreshStatus = useCallback(async () => {
    try {
      const next = await provider.getConnectionStatus();
      setConnection(next);
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
    if (provider.demo) return undefined;
    function handleCallback(url) {
      if (!url.startsWith("athleteos://integration/strava")) return;
      const result = new URL(url).searchParams.get("status");
      if (result === "connected") refreshStatus();
      else {
        setStatus(result === "cancelled" ? "disconnected" : "error");
        setError(result === "cancelled" ? "Strava-Verbindung wurde abgebrochen." : "Strava-Verbindung konnte nicht hergestellt werden.");
      }
    }
    Linking.getInitialURL().then((url) => { if (url) handleCallback(url); });
    const subscription = Linking.addEventListener("url", ({ url }) => handleCallback(url));
    return () => subscription.remove();
  }, [provider.demo, refreshStatus]);

  const connect = useCallback(async () => {
    setStatus("connecting"); setError(null);
    try {
      const next = await provider.connect();
      if (next.connected) { setConnection(next); setStatus("connected"); }
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
      return reconciled;
    } catch (syncError) { setStatus(syncError.code === "connection_expired" ? "expired" : "error"); setError(syncError.message); return null; }
  }, [provider, sessions]);

  return { providerId: provider.id, demo: provider.demo, activities, connection, status, lastSync, lastResult, error, connect, disconnect, syncActivities, refreshStatus };
}
