import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme";

export function Card({ children, style, dark = false }) {
  return (
    <View
      style={[
        styles.base,
        dark ? styles.dark : styles.light,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },

  light: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  dark: {
    backgroundColor: colors.black,
  },
});
