import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Card } from "./Card";
import { colors, radius, spacing, typography } from "../theme";

export function WorkoutCard({ workout, onStart }) {
  return (
    <Card dark style={styles.card}>
      <View style={styles.header}>
        <View style={styles.content}>
          <Text style={styles.type}>
            {workout.type.toUpperCase()}
          </Text>

          <Text style={styles.title}>{workout.title}</Text>

          <Text style={styles.meta}>
            {workout.duration} min • {workout.equipment}
          </Text>
        </View>

        <View style={styles.duration}>
          <Text style={styles.durationValue}>
            {workout.duration}
          </Text>
          <Text style={styles.durationLabel}>MIN</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={onStart}
      >
        <Text style={styles.buttonText}>START WORKOUT</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xxl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  content: {
    flex: 1,
  },

  type: {
    ...typography.label,
    color: colors.accent,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.headline,
    color: colors.white,
  },

  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  duration: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: "#282828",
    alignItems: "center",
    justifyContent: "center",
  },

  durationValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
  },

  durationLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.textMuted,
  },

  button: {
    height: 58,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    marginTop: spacing.xxl,
  },

  buttonText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: colors.black,
  },
});
