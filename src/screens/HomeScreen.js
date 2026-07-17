import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { RaceCard } from "../components/RaceCard";
import { RecoveryCard } from "../components/RecoveryCard";
import { SectionHeader } from "../components/SectionHeader";
import { TrainingLoadCard } from "../components/TrainingLoadCard";
import { TrainingSessionCard } from "../components/TrainingSessionCard";
import { TrainingStateView } from "../components/TrainingStateView";
import { TrainingSummary } from "../components/TrainingSummary";
import { useTraining } from "../context/TrainingContext";
import { athlete } from "../data/mockData";
import { toISODate } from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";
import {
  createTrainingNavigationRequest,
  addDays,
  formatMinutes,
  getNextPlannedSession,
  getSessionsForDate,
  getSessionsForWeek,
} from "../utils/trainingAnalytics";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export function HomeScreen({ navigation }) {
  const { sessions, isLoading, error, reloadTrainingPlan } = useTraining();
  const now = new Date();
  const today = toISODate(now);
  const todaySessions = getSessionsForDate(sessions, today);
  const weekSessions = getSessionsForWeek(sessions, now);
  const plannedToday = todaySessions.find((session) => session.status === "planned");
  const primarySession = plannedToday ?? todaySessions[0] ?? null;
  const nextSession = plannedToday
    ? null
    : getNextPlannedSession(sessions, addDays(now, 1));
  const dayMinutes = todaySessions.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const upcomingRaces = athlete.races.filter((race) => race.dateISO >= today);

  function openTraining(date = today, sessionId = null) {
    navigation.navigate(
      "Training",
      createTrainingNavigationRequest(date, sessionId),
    );
  }

  if (isLoading) {
    return <TrainingStateView loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>ATHLETEOS</Text>
            <Text style={styles.date}>{dateFormatter.format(now).toUpperCase()}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{athlete.profile.initial}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{getGreeting(now)}, {athlete.profile.name}</Text>
          <Text style={styles.heroText}>
            {todaySessions.length
              ? `${todaySessions.length} Einheiten mit insgesamt ${formatMinutes(dayMinutes)} stehen heute im Plan.`
              : "Heute ist keine Einheit geplant. Zeit für Regeneration oder einen freien Tag."}
          </Text>
        </View>

        {error ? <TrainingStateView compact error={error} onRetry={reloadTrainingPlan} /> : null}

        <SectionHeader
          title={todaySessions.length ? "Heutiges Training" : "Nächste Einheit"}
        />
        {primarySession ? (
          <View style={styles.sessionList}>
            <TrainingSessionCard
              session={primarySession}
              onPress={() => openTraining(primarySession.date, primarySession.id)}
            />
            {todaySessions
              .filter((session) => session.id !== primarySession.id)
              .map((session) => (
                <TrainingSessionCard
                  key={session.id}
                  session={session}
                  onPress={() => openTraining(session.date, session.id)}
                />
              ))}
          </View>
        ) : nextSession ? (
          <View>
            <Text style={styles.nextDate}>
              {dateFormatter.format(new Date(`${nextSession.date}T00:00:00`))}
            </Text>
            <TrainingSessionCard
              session={nextSession}
              onPress={() => openTraining(nextSession.date, nextSession.id)}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Keine kommende Einheit</Text>
            <Text style={styles.emptyText}>Öffne den Wochenplan, um dein nächstes Training zu planen.</Text>
          </View>
        )}

        {todaySessions.length && !plannedToday && nextSession ? (
          <View style={styles.nextSession}>
            <SectionHeader title="Nächste geplante Einheit" />
            <Text style={styles.nextDate}>
              {dateFormatter.format(new Date(`${nextSession.date}T00:00:00`))}
            </Text>
            <TrainingSessionCard
              session={nextSession}
              onPress={() => openTraining(nextSession.date, nextSession.id)}
            />
          </View>
        ) : null}

        <View style={styles.quickActions}>
          <QuickAction
            icon="barbell-outline"
            label="Training öffnen"
            onPress={() => openTraining()}
          />
          <QuickAction
            icon="calendar-outline"
            label="Wochenplan öffnen"
            onPress={() => navigation.navigate("Plan", { focusCurrent: Date.now() })}
          />
        </View>

        <SectionHeader title="Wochenfortschritt" />
        <View style={styles.summary}>
          <TrainingSummary sessions={weekSessions} />
        </View>

        <SectionHeader title="Lokale Demo-Werte" />
        <Text style={styles.demoNote}>
          Erholung und Belastung sind Beispieldaten und keine Messwerte eines Geräts.
        </Text>
        <View style={styles.metricRow}>
          <RecoveryCard recovery={athlete.recovery} />
          <TrainingLoadCard trainingLoad={athlete.trainingLoad} />
        </View>

        <SectionHeader title="Nächste Rennen" />
        <View style={styles.raceList}>
          {upcomingRaces.length
            ? upcomingRaces.map((race) => <RaceCard key={race.name} race={race} />)
            : <Text style={styles.emptyText}>Aktuell ist kein weiterer Wettkampf hinterlegt.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  headerText: { flex: 1 },
  brand: { ...typography.label, color: colors.textPrimary },
  date: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  avatarText: { fontWeight: "800", color: colors.white },
  hero: { marginBottom: spacing.xxl },
  heroTitle: { ...typography.headline, color: colors.textPrimary },
  heroText: {
    ...typography.body,
    maxWidth: 340,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  sessionList: { gap: spacing.md, marginBottom: spacing.xxl },
  nextSession: { marginTop: spacing.xxl },
  nextDate: {
    ...typography.caption,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.caption,
    maxWidth: 260,
    textAlign: "center",
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  quickAction: {
    minHeight: 56,
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickActionText: {
    ...typography.caption,
    flexShrink: 1,
    textAlign: "center",
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.68 },
  summary: { marginBottom: spacing.xxl },
  demoNote: {
    ...typography.caption,
    marginBottom: spacing.md,
    color: colors.textSecondary,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  raceList: { gap: spacing.md },
});
