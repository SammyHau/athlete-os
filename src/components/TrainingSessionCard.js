import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { sportMeta, statusMeta } from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";
import { summarizeWorkoutPrescription } from "../utils/workoutPrescription";

export function TrainingSessionCard({ session, onPress, linkedActivity = null }) {
  const sport = sportMeta[session.sport];
  const status = statusMeta[session.status];
  const completed = session.status === "completed" || Boolean(linkedActivity);
  const visibleStatus = linkedActivity ? "Mit Aktivität verknüpft" : status.label;
  const prescription = summarizeWorkoutPrescription(session);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sport.label}: ${session.title}, ${session.durationMinutes} Minuten, ${visibleStatus}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        completed && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.icon, completed && styles.iconCompleted]}>
        <Ionicons
          name={completed ? "checkmark" : sport.icon}
          size={22}
          color={completed ? colors.black : colors.textPrimary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topline}>
          <Text style={styles.sport}>{sport.label.toUpperCase()}</Text>
          <Text style={[styles.status, completed && styles.statusCompleted]}>
            {visibleStatus}
          </Text>
        </View>
        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.meta}>
          {session.durationMinutes} min · {session.intensity}
          {session.source ? ` · ${session.source}` : ""}
          {linkedActivity ? ` · ${linkedActivity.provider === "strava" ? "Strava" : "Demo"}` : ""}
        </Text>
        {prescription ? <Text style={styles.prescription}>{prescription}</Text> : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 116,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardCompleted: {
    borderColor: colors.surfaceMuted,
    backgroundColor: colors.surfaceMuted,
  },
  cardPressed: {
    opacity: 0.72,
  },
  icon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  iconCompleted: {
    backgroundColor: colors.accent,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sport: {
    ...typography.label,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  status: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  statusCompleted: {
    color: colors.textPrimary,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  prescription: { ...typography.caption, marginTop: spacing.sm, color: colors.textPrimary },
});
