import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

const formatter = new Intl.DateTimeFormat("de-DE", { weekday: "short" });

export function RecoveryHistory({ history }) {
  return (
    <View style={styles.history}>
      {history.map((item) => (
        <View key={item.date} style={styles.day}>
          <Text style={styles.dayLabel}>{formatter.format(new Date(`${item.date}T12:00:00`))}</Text>
          <View style={styles.barSpace}>
            {item.readiness ? <View style={[styles.bar, { height: `${Math.max(8, item.readiness.score)}%` }]} /> : <View style={styles.missing} />}
          </View>
          <Text style={styles.value}>{item.readiness?.score ?? "–"}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  history: { height: 148, flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  day: { flex: 1, minWidth: 0, alignItems: "center" },
  dayLabel: { fontSize: 10, lineHeight: 14, color: colors.textSecondary },
  barSpace: { width: "100%", height: 92, alignItems: "center", justifyContent: "flex-end", marginVertical: spacing.xs },
  bar: { width: 14, maxHeight: "100%", borderRadius: radius.pill, backgroundColor: colors.accent },
  missing: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  value: { ...typography.caption, color: colors.textPrimary },
});
