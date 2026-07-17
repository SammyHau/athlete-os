import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getCalendarWeek, toISODate } from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";

const shortDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
});
const endDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function TrainingWeekNavigation({ days, onPrevious, onNext, onToday }) {
  const today = toISODate(new Date());
  const isCurrentWeek = days.some((day) => day.isoDate === today);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Vorherige Kalenderwoche"
        onPress={onPrevious}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.week}>KW {getCalendarWeek(days[0].date)}</Text>
        <Text style={styles.range}>
          {shortDateFormatter.format(days[0].date)} – {endDateFormatter.format(days[6].date)}
        </Text>
        {!isCurrentWeek ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zur aktuellen Woche"
            hitSlop={8}
            onPress={onToday}
          >
            <Text style={styles.today}>Zur aktuellen Woche</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nächste Kalenderwoche"
        onPress={onNext}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.65,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  week: {
    ...typography.title,
    color: colors.textPrimary,
  },
  range: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  today: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textPrimary,
    textDecorationLine: "underline",
  },
});
