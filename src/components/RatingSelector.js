import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function RatingSelector({ label, value, onChange, lowLabel, highLabel, error }) {
  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{lowLabel} bis {highLabel}</Text>
      </View>
      <View style={styles.options}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Pressable
            key={rating}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${rating} von 5`}
            accessibilityState={{ selected: value === rating }}
            onPress={() => onChange(rating)}
            style={({ pressed }) => [
              styles.option,
              value === rating && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.optionText, value === rating && styles.optionTextSelected]}>{rating}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  labelRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  label: { ...typography.caption, color: colors.textPrimary },
  hint: { fontSize: 11, lineHeight: 15, color: colors.textSecondary },
  options: { flexDirection: "row", gap: spacing.sm },
  option: {
    width: 48,
    height: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.black, backgroundColor: colors.black },
  optionText: { ...typography.caption, color: colors.textPrimary },
  optionTextSelected: { color: colors.white },
  error: { fontSize: 11, lineHeight: 15, color: colors.danger },
  pressed: { opacity: 0.68 },
});
