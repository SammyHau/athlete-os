import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyticsBar } from "../components/AnalyticsBar";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { RecoveryHistory } from "../components/RecoveryHistory";
import { TrainingStateView } from "../components/TrainingStateView";
import { useRecovery } from "../context/RecoveryContext";
import { useIntegrations } from "../context/IntegrationContext";
import { useTraining } from "../context/TrainingContext";
import { sportMeta, statusMeta, toISODate } from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";
import {
  formatMinutes,
  addDays,
  getConsistency,
  getIntensityDistribution,
  getPeriodSessions,
  getSportDistribution,
  getStatusDistribution,
  getWeeklyTrend,
  safePercent,
  summarizeSessions,
} from "../utils/trainingAnalytics";
import {
  getLoadReadinessDescription,
  getRecoveryHistory,
  summarizeRecovery,
} from "../utils/recoveryAnalytics";
import {
  formatActivityDistance,
  formatActivityDuration,
  getActivitiesInRange,
  getActivitySportDistribution,
  getAverageRunPace,
  getActivitySportLabel,
  summarizeActivities,
} from "../utils/activityAnalytics";

const periods = [
  { days: 7, label: "7 Tage" },
  { days: 28, label: "28 Tage" },
  { days: 90, label: "90 Tage" },
];

export function ProgressScreen() {
  const { sessions, isLoading, error, reloadTrainingPlan } = useTraining();
  const recovery = useRecovery();
  const integration = useIntegrations();
  const [period, setPeriod] = useState(28);
  const analytics = useMemo(() => {
    const selected = getPeriodSessions(sessions, period);
    return {
      summary: summarizeSessions(selected),
      sports: getSportDistribution(selected),
      intensities: getIntensityDistribution(selected),
      statuses: getStatusDistribution(selected),
      trend: getWeeklyTrend(sessions, 6),
    };
  }, [period, sessions]);
  const consistency = getConsistency(analytics.trend);
  const trendMaxMinutes = Math.max(
    1,
    ...analytics.trend.map((item) => item.plannedMinutes),
  );
  const recoveryHistory = useMemo(
    () => getRecoveryHistory(recovery.checkIns, sessions, recovery.settings, 7),
    [recovery.checkIns, recovery.settings, sessions],
  );
  const recoverySummary = summarizeRecovery(recoveryHistory);
  const loadReadinessDescription = getLoadReadinessDescription(recoveryHistory, sessions);
  const activityStart = toISODate(addDays(new Date(), -(period - 1)));
  const periodActivities = getActivitiesInRange(integration.activities, activityStart, toISODate(new Date()));
  const actualSummary = summarizeActivities(periodActivities);
  const actualSports = getActivitySportDistribution(periodActivities);
  const averageRunPace = getAverageRunPace(periodActivities);

  if (isLoading || recovery.isLoading) {
    return <TrainingStateView loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.label}>TRAININGSANALYSE</Text>
        <Text style={styles.title}>Fortschritt</Text>
        <Text style={styles.intro}>
          Umfang, Erfüllung und Verteilung aus deinem gespeicherten Trainingsplan.
        </Text>

        {error ? <TrainingStateView compact error={error} onRetry={reloadTrainingPlan} /> : null}
        {recovery.error ? <TrainingStateView compact error={recovery.error} onRetry={recovery.reloadRecovery} /> : null}

        <SectionHeader title="Recovery · 7 Tage" />
        <Card style={styles.recoveryCard}>
          {recoverySummary.count ? (
            <>
              <RecoveryHistory history={recoveryHistory} />
              <View style={styles.recoveryMetrics}>
                <RecoveryMetric value={recoverySummary.count} label="Check-ins" />
                <RecoveryMetric value={formatMinutes(recoverySummary.averageSleepMinutes)} label="Ø Schlaf" />
                <RecoveryMetric value={`${recoverySummary.averageSleepQuality} / 5`} label="Ø Schlafqualität" />
                <RecoveryMetric value={`${recoverySummary.averageStress} / 5`} label="Ø Stress" />
              </View>
              {loadReadinessDescription ? <Text style={styles.recoveryDescription}>{loadReadinessDescription}</Text> : <Text style={styles.recoveryHint}>Für eine belastbare Verlaufsaussage werden mindestens vier Check-ins benötigt.</Text>}
            </>
          ) : (
            <Text style={styles.recoveryHint}>Noch keine Check-ins in den letzten sieben Tagen. Ohne Eingaben werden keine Readiness-Werte erzeugt.</Text>
          )}
        </Card>

        <View style={styles.segmented} accessibilityRole="tablist">
          {periods.map((item) => (
            <Pressable
              key={item.days}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === item.days }}
              accessibilityLabel={`Zeitraum ${item.label}`}
              onPress={() => setPeriod(item.days)}
              style={({ pressed }) => [
                styles.segment,
                period === item.days && styles.segmentActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.segmentText, period === item.days && styles.segmentTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.metrics}>
          <Metric value={analytics.summary.completedCount} label="Erledigte Einheiten" />
          <Metric value={formatMinutes(analytics.summary.completedMinutes)} label="Absolviert" />
          <Metric value={formatMinutes(analytics.summary.plannedMinutes)} label="Gesamt geplant" />
          <Metric value={`${analytics.summary.fulfillmentRate} %`} label="Erfüllungsgrad" />
          <Metric value={analytics.summary.skippedCount} label="Ausgelassen" />
          <Metric value={analytics.summary.totalCount} label="Einheiten gesamt" />
        </View>

        <SectionHeader title="Tatsächlich absolviert" />
        <Card style={styles.cardContent}>
          {periodActivities.length ? (
            <>
              <View style={styles.actualMetrics}>
                <RecoveryMetric value={actualSummary.count} label="Aktivitäten" />
                <RecoveryMetric value={formatActivityDuration(actualSummary.durationSeconds)} label="Reale Dauer" />
                <RecoveryMetric value={formatActivityDistance(actualSummary.distanceMeters) ?? "–"} label="Distanz" />
                <RecoveryMetric value={actualSummary.elevationGainMeters ? `${Math.round(actualSummary.elevationGainMeters)} m` : "–"} label="Höhenmeter" />
                {actualSummary.averageHeartRate ? <RecoveryMetric value={`${actualSummary.averageHeartRate} bpm`} label="Ø Herzfrequenz" /> : null}
                {actualSummary.averagePower ? <RecoveryMetric value={`${actualSummary.averagePower} W`} label="Ø Leistung" /> : null}
                {averageRunPace ? <RecoveryMetric value={averageRunPace} label="Ø Laufpace" /> : null}
              </View>
              {actualSports.map((item) => <AnalyticsBar key={item.sport} label={getActivitySportLabel(item.sport)} value={`${item.count} · ${formatActivityDuration(item.durationSeconds)}`} percentage={actualSummary.durationSeconds ? Math.round(item.durationSeconds / actualSummary.durationSeconds * 100) : 0} />)}
            </>
          ) : <EmptyAnalytics text="Im gewählten Zeitraum sind noch keine tatsächlichen Aktivitäten synchronisiert." />}
        </Card>

        <SectionHeader title="Sportarten" />
        <Card style={styles.cardContent}>
          {analytics.sports.some((item) => item.minutes > 0) ? (
            analytics.sports.filter((item) => item.minutes > 0).map((item) => (
              <AnalyticsBar
                key={item.key}
                label={sportMeta[item.key].label}
                value={`${formatMinutes(item.minutes)} · ${item.count}`}
                percentage={item.percentage}
              />
            ))
          ) : <EmptyAnalytics text="Im gewählten Zeitraum wurden noch keine Einheiten abgeschlossen." />}
        </Card>

        <SectionHeader title="Sechs-Wochen-Trend" />
        <Card style={styles.cardContent}>
          <View style={styles.consistencyRow}>
            <Text style={styles.consistencyValue}>{consistency.activeWeeks} / {consistency.totalWeeks}</Text>
            <Text style={styles.consistencyText}>Wochen mit abgeschlossenem Training</Text>
          </View>
          {analytics.trend.map((week) => (
              <View key={week.key} style={styles.trendWeek}>
                <Text style={styles.trendLabel}>KW {week.calendarWeek}</Text>
                <View style={styles.trendBars}>
                  <AnalyticsBar
                    label="Geplant"
                    value={formatMinutes(week.plannedMinutes)}
                    percentage={safePercent(week.plannedMinutes, trendMaxMinutes)}
                    muted
                  />
                  <AnalyticsBar
                    label="Erledigt"
                    value={formatMinutes(week.completedMinutes)}
                    percentage={safePercent(week.completedMinutes, trendMaxMinutes)}
                  />
                </View>
              </View>
          ))}
        </Card>

        <SectionHeader title="Intensität" />
        <Card style={styles.cardContent}>
          {analytics.intensities.some((item) => item.minutes > 0) ? (
            analytics.intensities.filter((item) => item.minutes > 0).map((item) => (
              <AnalyticsBar
                key={item.key}
                label={item.key}
                value={formatMinutes(item.minutes)}
                percentage={item.percentage}
                muted
              />
            ))
          ) : <EmptyAnalytics text="Für diesen Zeitraum liegen keine Intensitätsdaten vor." />}
        </Card>

        <SectionHeader title="Statusverteilung" />
        <Card style={styles.statusCard}>
          {analytics.statuses.map((item) => (
            <View key={item.key} style={styles.statusItem}>
              <Text style={styles.statusValue}>{item.count}</Text>
              <Text style={styles.statusLabel}>{statusMeta[item.key].label}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.definition}>
          Erfüllungsgrad = absolvierte Minuten im Verhältnis zu allen geplanten Minuten des gewählten Zeitraums.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label }) {
  return (
    <Card style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

function EmptyAnalytics({ text }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

function RecoveryMetric({ value, label }) {
  return <View style={styles.recoveryMetric}><Text style={styles.recoveryValue}>{value}</Text><Text style={styles.recoveryLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.huge },
  label: { ...typography.label, color: colors.textSecondary },
  title: { ...typography.headline, marginTop: spacing.xs, color: colors.textPrimary },
  intro: { ...typography.body, maxWidth: 360, marginTop: spacing.md, color: colors.textSecondary },
  recoveryCard: { marginTop: spacing.md, marginBottom: spacing.xxl },
  recoveryMetrics: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg, marginTop: spacing.lg },
  actualMetrics: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg },
  recoveryMetric: { width: "50%" },
  recoveryValue: { fontSize: 16, lineHeight: 21, fontWeight: "800", color: colors.textPrimary },
  recoveryLabel: { fontSize: 11, lineHeight: 15, marginTop: spacing.xs, color: colors.textSecondary },
  recoveryDescription: { ...typography.caption, marginTop: spacing.lg, color: colors.textPrimary },
  recoveryHint: { ...typography.caption, color: colors.textSecondary },
  segmented: {
    minHeight: 48,
    flexDirection: "row",
    marginTop: spacing.xxl,
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  segment: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { ...typography.caption, color: colors.textSecondary },
  segmentTextActive: { color: colors.textPrimary },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginVertical: spacing.xxl },
  metric: { width: "47%", flexGrow: 1, minHeight: 104, justifyContent: "space-between", padding: spacing.lg },
  metricValue: { ...typography.title, color: colors.textPrimary },
  metricLabel: { ...typography.caption, marginTop: spacing.sm, color: colors.textSecondary },
  cardContent: { gap: spacing.lg, padding: spacing.lg, marginBottom: spacing.xxl },
  consistencyRow: { paddingBottom: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  consistencyValue: { ...typography.title, color: colors.textPrimary },
  consistencyText: { ...typography.caption, marginTop: spacing.xs, color: colors.textSecondary },
  trendWeek: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  trendLabel: { ...typography.caption, width: 44, color: colors.textSecondary },
  trendBars: { flex: 1, minWidth: 0, gap: spacing.md },
  statusCard: { flexDirection: "row", padding: spacing.lg, marginBottom: spacing.xl },
  statusItem: { flex: 1, minWidth: 0 },
  statusValue: { ...typography.title, color: colors.textPrimary },
  statusLabel: { fontSize: 11, lineHeight: 15, marginTop: spacing.xs, color: colors.textSecondary },
  definition: { ...typography.caption, color: colors.textMuted },
  emptyText: { ...typography.caption, color: colors.textSecondary },
  pressed: { opacity: 0.68 },
});
