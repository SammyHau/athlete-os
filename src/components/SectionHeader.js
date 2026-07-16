import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

export function SectionHeader({ title, action }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {action ? (
        <Text style={styles.action}>{action}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  title: {
    ...typography.title,
    color: colors.textPrimary,
  },

  action: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
