import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { RaceCard } from "../components/RaceCard";
import { RecoveryCard } from "../components/RecoveryCard";
import { SectionHeader } from "../components/SectionHeader";
import { TrainingLoadCard } from "../components/TrainingLoadCard";
import { WeeklyOverview } from "../components/WeeklyOverview";
import { WorkoutCard } from "../components/WorkoutCard";
import { athlete } from "../data/mockData";
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
            <Text style={styles.avatarText}>
              {athlete.profile.initial}
            </Text>
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
          <RecoveryCard recovery={athlete.recovery} />
          <TrainingLoadCard trainingLoad={athlete.trainingLoad} />
        </View>

        <SectionHeader title="Today" action="Edit" />
        <WorkoutCard workout={athlete.workout} />

        <SectionHeader title="This week" action="Details" />
        <WeeklyOverview week={athlete.week} />

        <SectionHeader title="Next race" action="Calendar" />
        <RaceCard race={athlete.race} />
      </ScrollView>
    </SafeAreaView>
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
});