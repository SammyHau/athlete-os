import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { colors, spacing, typography } from "../theme";

export function WeeklyOverview({ week }) {
  return (
    <Card style={styles.card}>
      <WeekMetric value={week.swim} label="Schwimmen" />
      <WeekMetric value={week.bike} label="Rad" />
      <WeekMetric value={week.run} label="Laufen" />
      <WeekMetric value={week.strength} label="Kraft" />
    </Card>
  );
}

function WeekMetric({ value, label }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xxl,
  },

  metric: {
    alignItems: "center",
  },

  value: {
    fontSize: 27,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
