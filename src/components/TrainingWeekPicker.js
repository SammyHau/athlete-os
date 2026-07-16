import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

const dayFormatter = new Intl.DateTimeFormat("de-DE", { weekday: "short" });

export function TrainingWeekPicker({ days, selectedDate, today, onSelect }) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {days.map(({ date, isoDate }) => {
        const selected = isoDate === selectedDate;
        const isToday = isoDate === today;

        return (
          <Pressable
            key={isoDate}
            accessibilityRole="tab"
            accessibilityLabel={`${dayFormatter.format(date)}, ${date.getDate()}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(isoDate)}
            style={({ pressed }) => [
              styles.day,
              selected && styles.daySelected,
              pressed && styles.dayPressed,
            ]}
          >
            <Text style={[styles.dayName, selected && styles.textSelected]}>
              {dayFormatter.format(date).replace(".", "").toUpperCase()}
            </Text>
            <Text style={[styles.dayNumber, selected && styles.textSelected]}>
              {date.getDate()}
            </Text>
            <View style={[styles.todayMark, isToday && styles.todayMarkVisible]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  day: {
    flex: 1,
    minWidth: 0,
    height: 72,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  daySelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  dayPressed: {
    opacity: 0.72,
  },
  dayName: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    color: colors.textMuted,
  },
  dayNumber: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
  textSelected: {
    color: colors.white,
  },
  todayMark: {
    width: 4,
    height: 4,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "transparent",
  },
  todayMarkVisible: {
    backgroundColor: colors.accent,
  },
});
