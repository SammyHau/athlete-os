import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { colors, radius, spacing, typography } from "../theme";

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PERFORMANCE</Text>
            <Text style={styles.date}>DONNERSTAG - 16. JULI</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>TODAY</Text>
          <Text style={styles.heroTitle}>Ready to perform.</Text>
          <Text style={styles.heroText}>
            Oberkörper und Core stehen heute im Mittelpunkt.
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>RECOVERY</Text>
            <Text style={styles.metricValue}>78</Text>
            <Text style={styles.metricHint}>Good</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>TRAINING LOAD</Text>
            <Text style={styles.metricValueSmall}>BAL</Text>
            <Text style={styles.metricHint}>Balanced</Text>
          </Card>
        </View>

        <SectionHeader title="Today" action="Edit" />

        <Card dark style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutContent}>
              <Text style={styles.workoutType}>STRENGTH</Text>
              <Text style={styles.workoutTitle}>Upper Body + Core</Text>
              <Text style={styles.workoutMeta}>
                45 min - Dumbbells - Calisthenics
              </Text>
            </View>

            <View style={styles.duration}>
              <Text style={styles.durationValue}>45</Text>
              <Text style={styles.durationLabel}>MIN</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.startButton}>
            <Text style={styles.startButtonText}>START WORKOUT</Text>
          </TouchableOpacity>
        </Card>

        <SectionHeader title="This week" action="Details" />

        <Card style={styles.weekCard}>
          <WeekMetric value="2" label="Swim" />
          <WeekMetric value="3" label="Bike" />
          <WeekMetric value="2" label="Run" />
          <WeekMetric value="4" label="Strength" />
        </Card>

        <SectionHeader title="Next race" action="Calendar" />

        <View style={styles.raceCard}>
          <View>
            <Text style={styles.raceType}>SPRINT TRIATHLON</Text>
            <Text style={styles.raceTitle}>Steinhude</Text>
            <Text style={styles.raceMeta}>750 m - 20 km - 5 km</Text>
          </View>

          <View style={styles.countdown}>
            <Text style={styles.countdownValue}>12</Text>
            <Text style={styles.countdownLabel}>DAYS</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WeekMetric({ value, label }) {
  return (
    <View style={styles.weekMetric}>
      <Text style={styles.weekValue}>{value}</Text>
      <Text style={styles.weekLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xxxl,
  },

  brand: {
    ...typography.label,
    color: colors.textPrimary,
  },

  date: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    color: colors.textSecondary,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
  },

  avatarText: {
    color: colors.white,
    fontWeight: "800",
  },

  hero: {
    marginBottom: spacing.xxl,
  },

  eyebrow: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  heroTitle: {
    ...typography.hero,
    color: colors.textPrimary,
  },

  heroText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    maxWidth: 320,
  },

  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  metricCard: {
    flex: 1,
    minHeight: 145,
    justifyContent: "space-between",
  },

  metricLabel: {
    ...typography.label,
    color: colors.textMuted,
  },

  metricValue: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  metricValueSmall: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  metricHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  workoutCard: {
    marginBottom: spacing.xxl,
  },

  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  workoutContent: {
    flex: 1,
  },

  workoutType: {
    ...typography.label,
    color: colors.accent,
    marginBottom: spacing.md,
  },

  workoutTitle: {
    ...typography.headline,
    color: colors.white,
  },

  workoutMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  duration: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: "#282828",
    alignItems: "center",
    justifyContent: "center",
  },

  durationValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
  },

  durationLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.textMuted,
  },

  startButton: {
    height: 58,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    marginTop: spacing.xxl,
  },

  startButtonText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: colors.black,
  },

  weekCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xxl,
  },

  weekMetric: {
    alignItems: "center",
  },

  weekValue: {
    fontSize: 27,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  weekLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  raceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },

  raceType: {
    ...typography.label,
    color: colors.textSecondary,
  },

  raceTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  raceMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  countdown: {
    alignItems: "center",
  },

  countdownValue: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  countdownLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
});
