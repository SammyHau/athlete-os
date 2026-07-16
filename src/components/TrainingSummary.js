import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { colors, radius, spacing, typography } from "../theme";

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${rest ? `${rest} min` : ""}`.trim() : `${rest} min`;
}

export function TrainingSummary({ sessions }) {
  const planned = sessions.filter((item) => item.status === "planned");
  const completed = sessions.filter((item) => item.status === "completed");
  const plannedMinutes = sessions.reduce((sum, item) => sum + item.durationMinutes, 0);
  const completedMinutes = completed.reduce((sum, item) => sum + item.durationMinutes, 0);
  const progress = plannedMinutes ? completedMinutes / plannedMinutes : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>WOCHENFORTSCHRITT</Text>
          <Text style={styles.progressValue}>{Math.round(progress * 100)} %</Text>
        </View>
        <Text style={styles.progressMeta}>
          {completed.length} von {sessions.length} erledigt
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{planned.length}</Text>
          <Text style={styles.metricLabel}>Geplant</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{completed.length}</Text>
          <Text style={styles.metricLabel}>Erledigt</Text>
        </View>
        <View style={styles.metricWide}>
          <Text style={styles.metricValue}>{formatMinutes(plannedMinutes)}</Text>
          <Text style={styles.metricLabel}>Geplant</Text>
        </View>
        <View style={styles.metricWide}>
          <Text style={styles.metricValue}>{formatMinutes(completedMinutes)}</Text>
          <Text style={styles.metricLabel}>Absolviert</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  progressValue: {
    ...typography.title,
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
  progressMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  track: {
    height: 8,
    marginTop: spacing.lg,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.lg,
    rowGap: spacing.lg,
  },
  metric: {
    width: "50%",
  },
  metricWide: {
    width: "50%",
  },
  metricValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
});
