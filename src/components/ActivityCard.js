import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";
import { formatActivityDistance, formatActivityDuration, getActivitySportLabel } from "../utils/activityAnalytics";

export function ActivityCard({ activity, compact = false }) {
  const meta = [formatActivityDuration(activity.movingTimeSeconds ?? activity.durationSeconds), formatActivityDistance(activity.distanceMeters)].filter(Boolean);
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.icon}><Ionicons name={activityIcon(activity.sport)} size={20} color={colors.textPrimary} /></View>
      <View style={styles.content}>
        <View style={styles.topline}>
          <Text style={styles.sport}>{getActivitySportLabel(activity.sport).toUpperCase()}</Text>
          <Text style={styles.provider}>{activity.provider === "strava" ? "STRAVA" : "DEMO"}</Text>
        </View>
        <Text style={styles.title}>{activity.name}</Text>
        <Text style={styles.meta}>{meta.join(" · ")}{activity.plannedSessionId ? " · Mit Plan verknüpft" : ""}</Text>
        {activity.externalUrl ? (
          <Pressable accessibilityRole="link" accessibilityLabel="Aktivität auf Strava ansehen" onPress={() => Linking.openURL(activity.externalUrl)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={styles.linkText}>Auf Strava ansehen</Text><Ionicons name="open-outline" size={15} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

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
