import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export function TrainingStateView({ loading = false, error, onRetry, compact = false }) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <View style={styles.icon}>
          <Ionicons name="cloud-offline-outline" size={24} color={colors.textSecondary} />
        </View>
      )}
      <Text style={styles.title}>
        {loading ? "Trainingsdaten werden geladen" : "Trainingsdaten nicht verfügbar"}
      </Text>
      {error ? <Text style={styles.text}>{error}</Text> : null}
      {!loading && onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trainingsdaten erneut laden"
          onPress={onRetry}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Erneut versuchen</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  compact: {
    flex: 0,
    minHeight: 0,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: spacing.md,
    textAlign: "center",
    color: colors.textPrimary,
  },
  text: {
    ...typography.caption,
    maxWidth: 280,
    marginTop: spacing.sm,
    textAlign: "center",
    color: colors.textSecondary,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  buttonText: {
    ...typography.caption,
    color: colors.white,
  },
  pressed: {
    opacity: 0.68,
  },
});
