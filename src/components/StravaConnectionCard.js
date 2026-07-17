import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function StravaConnectionCard({ integration, onConnect, onSync, onDisconnect }) {
  const connected = integration.connection.connected;
  const status = statusText(integration.status, integration.demo);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><Ionicons name="logo-strava" size={24} color={colors.white} /></View>
        <View style={styles.headerText}><Text style={styles.title}>Strava</Text><Text style={styles.status}>{status}</Text></View>
        <View style={[styles.dot, connected && styles.dotConnected]} />
      </View>
      {integration.demo ? <Text style={styles.demo}>DEMO-MODUS · ausschließlich künstliche Aktivitäten</Text> : null}
      {__DEV__ ? (
        <View style={styles.diagnostics}>
          <Text style={styles.diagnosticText}>Modus: {integration.diagnostics.mode}</Text>
          <Text style={styles.diagnosticText}>API: {integration.diagnostics.apiUrl}</Text>
          <Text style={styles.diagnosticText}>Backend: {healthText(integration.diagnostics.backendReachable)}</Text>
        </View>
      ) : null}
      {connected && integration.connection.athlete ? <Text style={styles.athlete}>{integration.connection.athlete.firstname} {integration.connection.athlete.lastname}</Text> : null}
      {integration.lastSync ? <Text style={styles.meta}>Letzter Sync: {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(integration.lastSync))}</Text> : null}
      {integration.lastResult ? <Text style={styles.meta}>{integration.lastResult.created} neu · {integration.lastResult.updated} aktualisiert · {integration.lastResult.skipped} übersprungen · {integration.lastResult.errors} Fehler</Text> : null}
      {integration.error ? <Text style={styles.error}>{integration.error}</Text> : null}
      <View style={styles.actions}>
        {!connected ? <Action label="Mit Strava verbinden" onPress={onConnect} primary disabled={integration.status === "connecting"} /> : (
          <><Action label="Jetzt synchronisieren" onPress={onSync} primary disabled={integration.status === "syncing"} /><Action label="Verbindung trennen" onPress={onDisconnect} /></>
        )}
      </View>
    </View>
  );
}

function Action({ label, onPress, primary = false, disabled = false }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, primary && styles.primary, disabled && styles.disabled, pressed && styles.pressed]}><Text style={[styles.actionText, primary && styles.primaryText]}>{label}</Text></Pressable>;
}

function statusText(status, demo) {
  return { loading: "Status wird geladen", disconnected: "Nicht verbunden", connecting: "Verbindung wird hergestellt", connected: demo ? "Demo verbunden" : "Verbunden", syncing: "Synchronisierung läuft", synced: "Synchronisiert", error: "Fehler", expired: "Verbindung abgelaufen" }[status] ?? "Nicht verbunden";
}

function healthText(reachable) {
  if (reachable === null) return "wird geprüft";
  return reachable ? "erreichbar" : "nicht erreichbar";
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.black },
  headerText: { flex: 1 },
  title: { fontSize: 18, lineHeight: 23, fontWeight: "800", color: colors.textPrimary },
  status: { ...typography.caption, marginTop: spacing.xs, color: colors.textSecondary },
  dot: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  dotConnected: { backgroundColor: colors.success },
  demo: { fontSize: 10, lineHeight: 14, fontWeight: "800", marginTop: spacing.lg, color: colors.warning },
  diagnostics: { gap: spacing.xs, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.background },
  diagnosticText: { fontSize: 10, lineHeight: 14, color: colors.textSecondary },
  athlete: { ...typography.caption, marginTop: spacing.lg, color: colors.textPrimary },
  meta: { fontSize: 11, lineHeight: 16, marginTop: spacing.sm, color: colors.textSecondary },
  error: { ...typography.caption, marginTop: spacing.md, color: colors.danger },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  action: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  primary: { borderColor: colors.black, backgroundColor: colors.black },
  actionText: { ...typography.caption, color: colors.textPrimary },
  primaryText: { color: colors.white },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.68 },
});
