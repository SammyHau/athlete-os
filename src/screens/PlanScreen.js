import { SafeAreaView, StyleSheet, Text } from "react-native";
import { colors, spacing, typography } from "../theme";

export function PlanScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.label}>PLAN</Text>
      <Text style={styles.title}>Your week.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
});
