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

const today = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
}).format(new Date()).toUpperCase();

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
            <Text style={styles.brand}>ATHLETEOS</Text>
            <Text style={styles.date}>{today}</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {athlete.profile.initial}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>HEUTE</Text>
          <Text style={styles.heroTitle}>Bereit f{"\u00fcr"} Leistung.</Text>
          <Text style={styles.heroText}>
            Oberk{"\u00f6"}rper und Core stehen heute im Mittelpunkt.
          </Text>
        </View>

        <View style={styles.metricRow}>
          <RecoveryCard recovery={athlete.recovery} />
          <TrainingLoadCard trainingLoad={athlete.trainingLoad} />
        </View>

        <SectionHeader title="Heute" action="Bearbeiten" />
        <WorkoutCard workout={athlete.workout} />

        <SectionHeader title="Diese Woche" action="Details" />
        <WeeklyOverview week={athlete.week} />

        <SectionHeader title={"N\u00e4chste Rennen"} action="Kalender" />
        <View style={styles.raceList}>
          {athlete.races.map((race) => (
            <RaceCard key={race.name} race={race} />
          ))}
        </View>
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

  raceList: {
    gap: spacing.md,
  },
});
