import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";
import { formatActivityDistance, formatActivityDuration, getActivitySportLabel } from "../utils/activityAnalytics";

export function ActivityCard({ activity, compact = false, onPress }) {
  const meta = activitySummary(activity);
  return (
    <Pressable accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={onPress ? `Aktivitätsdetails für ${activity.name} öffnen` : undefined} onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}>
      <View style={styles.icon}><Ionicons name={activityIcon(activity.sport)} size={20} color={colors.textPrimary} /></View>
      <View style={styles.content}>
        <View style={styles.topline}>
          <Text style={styles.sport}>{getActivitySportLabel(activity.sport).toUpperCase()}</Text>
          <Text style={styles.provider}>{activity.provider === "strava" ? "STRAVA" : "DEMO"}</Text>
        </View>
        <Text style={styles.title}>{activity.name}</Text>
        <Text style={styles.meta}>{meta.join(" · ")}{activity.plannedSessionId ? " · Mit Plan verknüpft" : ""}</Text>
        {activity.externalUrl && !onPress ? (
          <Pressable accessibilityRole="link" accessibilityLabel="Aktivität auf Strava ansehen" onPress={() => Linking.openURL(activity.externalUrl)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={styles.linkText}>Auf Strava ansehen</Text><Ionicons name="open-outline" size={15} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function activitySummary(activity) {
  const duration = formatActivityDuration(activity.movingTimeSeconds ?? activity.durationSeconds);
  const distance = formatActivityDistance(activity.distanceMeters);
  const heartRate = activity.averageHeartRate ? `${Math.round(activity.averageHeartRate)} bpm` : null;
  const elevation = activity.elevationGainMeters ? `${Math.round(activity.elevationGainMeters)} Hm` : null;
  if (activity.sport === "run") return [distance, duration, pace(activity, 1000, "min/km"), heartRate, elevation].filter(Boolean);
  if (activity.sport === "bike") return [distance, duration, activity.averageSpeed ? `${(activity.averageSpeed * 3.6).toFixed(1)} km/h` : null, activity.averagePower ? `${Math.round(activity.averagePower)} W` : null, heartRate, elevation].filter(Boolean);
  if (activity.sport === "swim") return [distance, duration, pace(activity, 100, "min/100 m"), heartRate].filter(Boolean);
  return [duration, heartRate, activity.calories ? `${Math.round(activity.calories)} kcal` : null].filter(Boolean);
}

function pace(activity, distanceUnit, label) { if (!activity.distanceMeters) return null; const seconds = (activity.movingTimeSeconds ?? activity.durationSeconds) / (activity.distanceMeters / distanceUnit); return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")} ${label}`; }

function activityIcon(sport) {
  return { run: "walk-outline", bike: "bicycle-outline", swim: "water-outline", strength: "barbell-outline", walk: "footsteps-outline", hike: "trail-sign-outline" }[sport] ?? "fitness-outline";
}

const styles = StyleSheet.create({
  card: { minHeight: 112, flexDirection: "row", alignItems: "flex-start", gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  compact: { minHeight: 92, padding: spacing.md },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.background },
  content: { flex: 1, minWidth: 0 },
  topline: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  sport: { ...typography.label, flexShrink: 1, color: colors.textSecondary },
  provider: { fontSize: 9, lineHeight: 12, fontWeight: "800", color: colors.textMuted },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "800", marginTop: spacing.xs, color: colors.textPrimary },
  meta: { ...typography.caption, marginTop: spacing.xs, color: colors.textSecondary },
  link: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: spacing.xs, alignSelf: "flex-start", marginTop: spacing.sm },
  linkText: { ...typography.caption, color: colors.textPrimary },
  pressed: { opacity: 0.68 },
});
