import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { colors, spacing, typography } from "../theme";

export function RaceCard({ race }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const raceDate = new Date(`${race.dateISO}T00:00:00`);
  const daysUntilRace = Math.max(
    0,
    Math.round((raceDate - today) / 86400000),
  );

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.type}>
          {race.type.toUpperCase()}
        </Text>

        <Text style={styles.title}>{race.name}</Text>
        <Text style={styles.date}>{race.date}</Text>
        <Text style={styles.meta}>{race.distance}</Text>
      </View>

      <View style={styles.countdown}>
        <Text style={styles.days}>{daysUntilRace}</Text>
        <Text style={styles.daysLabel}>TAGE</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.surfaceMuted,
  },

  content: {
    flex: 1,
    paddingRight: spacing.lg,
  },

  type: {
    ...typography.label,
    color: colors.textSecondary,
  },

  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  date: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  countdown: {
    alignItems: "center",
  },

  days: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  daysLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
});
