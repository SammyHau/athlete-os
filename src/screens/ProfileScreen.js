import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { StravaConnectionCard } from "../components/StravaConnectionCard";
import { TrainingStateView } from "../components/TrainingStateView";
import { useRecovery } from "../context/RecoveryContext";
import { useIntegrations } from "../context/IntegrationContext";
import { toISODate } from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";
import { addDays } from "../utils/trainingAnalytics";
import { getPersonalBaselines } from "../utils/recoveryAnalytics";

export function ProfileScreen() {
  const recovery = useRecovery();
  const integration = useIntegrations();
  const [hours, setHours] = useState("7");
  const [minutes, setMinutes] = useState("30");
  const tomorrow = toISODate(addDays(new Date(), 1));
  const baselines = getPersonalBaselines(recovery.checkIns, tomorrow);

  useEffect(() => {
    setHours(String(Math.floor(recovery.settings.sleepGoalMinutes / 60)));
    setMinutes(String(recovery.settings.sleepGoalMinutes % 60));
  }, [recovery.settings.sleepGoalMinutes]);

  if (recovery.isLoading) return <TrainingStateView loading />;

  function saveSleepGoal() {
    const parsedHours = Number.parseInt(hours || "0", 10) || 0;
    const parsedMinutes = Number.parseInt(minutes || "0", 10) || 0;
    if (parsedHours < 0 || parsedHours > 12 || parsedMinutes < 0 || parsedMinutes > 59) {
      Alert.alert("Schlafziel prüfen", "Bitte Stunden und Minuten im gültigen Bereich eingeben.");
      return;
    }
    const total = parsedHours * 60 + parsedMinutes;
    if (!recovery.updateSettings({ sleepGoalMinutes: total })) {
      Alert.alert("Schlafziel prüfen", "Das Schlafziel muss zwischen 4 und 12 Stunden liegen.");
    }
  }

  function confirmReset() {
    Alert.alert("Recovery-Daten zurücksetzen?", "Alle lokalen Check-ins und Recovery-Einstellungen werden entfernt.", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Zurücksetzen", style: "destructive", onPress: recovery.resetRecovery },
    ]);
  }

  function confirmDisconnect() {
    Alert.alert("Strava-Verbindung trennen?", "Lokal synchronisierte Aktivitäten dieses Dienstes werden ebenfalls entfernt.", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Trennen", style: "destructive", onPress: integration.disconnect },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>PROFIL</Text>
        <Text style={styles.title}>Samuel</Text>

        {recovery.error ? <TrainingStateView compact error={recovery.error} onRetry={recovery.reloadRecovery} /> : null}

        <Text style={styles.sectionTitle}>Verbundene Dienste</Text>
        <StravaConnectionCard integration={integration} onConnect={integration.connect} onSync={integration.syncActivities} onDisconnect={confirmDisconnect} />

        <Text style={styles.sectionTitle}>Recovery-Einstellungen</Text>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Persönliches Schlafziel</Text>
          <Text style={styles.cardText}>Dieses Ziel fließt direkt in deine Schlafbewertung ein.</Text>
          <View style={styles.inputRow}>
            <GoalInput label="Stunden" value={hours} onChange={setHours} />
            <GoalInput label="Minuten" value={minutes} onChange={setMinutes} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Schlafziel speichern" onPress={saveSleepGoal} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Schlafziel speichern</Text>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <SettingToggle
            label="Ruhepuls-Basiswert"
            description={baselines.restingHeartRate ? `Persönlicher Verlauf: ${baselines.restingHeartRate} bpm` : "Mindestens sieben persönliche Werte erforderlich"}
            value={recovery.settings.useRestingHeartRateBaseline}
            onChange={(value) => recovery.updateSettings({ useRestingHeartRateBaseline: value })}
          />
          <View style={styles.divider} />
          <SettingToggle
            label="HRV-Basiswert"
            description={baselines.hrv ? `Persönlicher Verlauf: ${baselines.hrv} ms` : "Mindestens sieben persönliche Werte erforderlich"}
            value={recovery.settings.useHrvBaseline}
            onChange={(value) => recovery.updateSettings({ useHrvBaseline: value })}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Lokale Recovery-Daten</Text>
          <Text style={styles.cardText}>{recovery.checkIns.length} Check-ins sind auf diesem Gerät gespeichert.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Lokale Recovery-Daten zurücksetzen" onPress={confirmReset} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
            <Text style={styles.resetText}>Recovery-Daten zurücksetzen</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalInput({ label, value, onChange }) {
  return <View style={styles.goalField}><Text style={styles.inputLabel}>{label}</Text><TextInput accessibilityLabel={`Schlafziel ${label}`} keyboardType="number-pad" value={value} onChangeText={onChange} style={styles.input} /></View>;
}

function SettingToggle({ label, description, value, onChange }) {
  return <View style={styles.toggleRow}><View style={styles.toggleText}><Text style={styles.toggleLabel}>{label}</Text><Text style={styles.toggleDescription}>{description}</Text></View><Switch accessibilityLabel={`${label} automatisch verwenden`} value={value} onValueChange={onChange} trackColor={{ false: colors.surfaceMuted, true: colors.accent }} thumbColor={colors.white} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },
  label: { ...typography.label, color: colors.textSecondary },
  title: { ...typography.headline, marginTop: spacing.xs, color: colors.textPrimary },
  sectionTitle: { ...typography.title, marginTop: spacing.xxl, marginBottom: spacing.md, color: colors.textPrimary },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 18, lineHeight: 23, fontWeight: "800", color: colors.textPrimary },
  cardText: { ...typography.caption, marginTop: spacing.sm, color: colors.textSecondary },
  inputRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  goalField: { flex: 1, minWidth: 0 },
  inputLabel: { ...typography.caption, marginBottom: spacing.sm, color: colors.textPrimary },
  input: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.textPrimary },
  primaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.black },
  primaryText: { ...typography.caption, color: colors.white },
  toggleRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md },
  toggleText: { flex: 1, minWidth: 0 },
  toggleLabel: { ...typography.caption, color: colors.textPrimary },
  toggleDescription: { fontSize: 11, lineHeight: 15, marginTop: spacing.xs, color: colors.textSecondary },
  divider: { height: 1, marginVertical: spacing.md, backgroundColor: colors.border },
  resetButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.danger },
  resetText: { ...typography.caption, color: colors.danger },
  pressed: { opacity: 0.68 },
});
