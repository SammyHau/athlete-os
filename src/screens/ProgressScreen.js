import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../theme";

export function ProgressScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.label}>PROGRESS</Text>
      <Text style={styles.title}>See the work.</Text>
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
