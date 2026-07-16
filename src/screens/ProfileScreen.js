import { SafeAreaView, StyleSheet, Text } from "react-native";
import { colors, spacing, typography } from "../theme";

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.label}>PROFILE</Text>
      <Text style={styles.title}>Samuel.</Text>
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
