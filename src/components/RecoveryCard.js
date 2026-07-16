import { StyleSheet, Text } from "react-native";

import { Card } from "./Card";
import { colors, spacing, typography } from "../theme";

export function RecoveryCard({ recovery }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>RECOVERY</Text>
      <Text style={styles.value}>{recovery.score}</Text>
      <Text style={styles.status}>{recovery.status}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 145,
    justifyContent: "space-between",
  },

  label: {
    ...typography.label,
    color: colors.textMuted,
  },

  value: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  status: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
