import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function AnalyticsBar({ label, value, percentage, muted = false }) {
  const width = `${Math.max(0, Math.min(100, percentage || 0))}%`;

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, muted && styles.fillMuted, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: { ...typography.caption, flex: 1, color: colors.textPrimary },
  value: { ...typography.caption, color: colors.textSecondary },
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.accent },
  fillMuted: { backgroundColor: colors.textPrimary },
});
