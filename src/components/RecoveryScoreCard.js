import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function RecoveryScoreCard({ readiness, hasCheckIn, onOpen, onCheckIn }) {
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={hasCheckIn ? `Readiness ${readiness.score}, Details öffnen` : "Recovery-Check-in ausfüllen"} onPress={hasCheckIn ? onOpen : onCheckIn} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={styles.topline}>
          <Text style={styles.label}>READINESS</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
        {hasCheckIn ? (
          <>
            <View style={styles.scoreRow}><Text style={styles.score}>{readiness.score}</Text><Text style={styles.scale}>/ 100</Text></View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors[readiness.status.tone] ?? colors.textPrimary }]} />
              <Text style={styles.status}>{readiness.status.label}</Text>
            </View>
            <Text style={styles.complete}>Heutiger Check-in vollständig</Text>
            <Text style={styles.reason}>{readiness.recommendation}</Text>
          </>
        ) : (
          <>
            <Text style={styles.emptyTitle}>Noch kein Check-in</Text>
            <Text style={styles.reason}>Beantworte sechs kurze Fragen für deine heutige Einschätzung.</Text>
          </>
        )}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={hasCheckIn ? "Heutigen Check-in bearbeiten" : "Heutigen Check-in ausfüllen"} onPress={onCheckIn} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <Text style={styles.actionText}>{hasCheckIn ? "Check-in bearbeiten" : "Check-in ausfüllen"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 240, padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  main: { flex: 1 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { ...typography.label, color: colors.textMuted },
  scoreRow: { flexDirection: "row", alignItems: "baseline", marginTop: spacing.lg },
  score: { fontSize: 44, lineHeight: 48, fontWeight: "800", color: colors.textPrimary },
  scale: { ...typography.caption, marginLeft: spacing.xs, color: colors.textSecondary },
  status: { ...typography.caption, marginTop: spacing.xs, color: colors.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: radius.pill },
  complete: { fontSize: 11, lineHeight: 15, marginTop: spacing.xs, color: colors.textSecondary },
  emptyTitle: { ...typography.title, marginTop: spacing.xl, color: colors.textPrimary },
  reason: { ...typography.caption, marginTop: spacing.sm, color: colors.textSecondary },
  action: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.black },
  actionText: { ...typography.caption, color: colors.white },
  pressed: { opacity: 0.7 },
});
