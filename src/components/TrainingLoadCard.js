import { StyleSheet, Text } from "react-native";

import { Card } from "./Card";
import { colors, typography } from "../theme";

export function TrainingLoadCard({ trainingLoad }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>TRAINING LOAD</Text>
      <Text style={styles.value}>{trainingLoad.score}</Text>
      <Text style={styles.status}>{trainingLoad.status}</Text>
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
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  status: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
