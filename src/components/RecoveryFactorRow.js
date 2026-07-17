import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function RecoveryFactorRow({ label, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.header}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%` }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  label: { ...typography.caption, color: colors.textPrimary },
  value: { ...typography.caption, color: colors.textSecondary },
  track: { height: 7, overflow: "hidden", borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.accent },
});
