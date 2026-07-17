import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function EstimatedLoadCard({ load }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>GESCHÄTZTE BELASTUNG</Text>
      <Text style={styles.value}>{load.last7}</Text>
      <Text style={styles.status}>7 Tage · {trendLabel(load.trend)}</Text>
      <Text style={styles.note}>Aus Dauer, Sportart und Intensität abgeschlossener Einheiten.</Text>
    </View>
  );
}

function trendLabel(trend) { return trend === "steigend" ? "Steigend" : trend === "sinkend" ? "Sinkend" : "Stabil"; }

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 240, justifyContent: "space-between", padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  label: { ...typography.label, color: colors.textMuted },
  value: { fontSize: 38, lineHeight: 43, fontWeight: "800", color: colors.textPrimary },
  status: { ...typography.caption, color: colors.textPrimary },
  note: { fontSize: 11, lineHeight: 15, color: colors.textSecondary },
});
