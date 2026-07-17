import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { RaceCard } from "../components/RaceCard";
import { EstimatedLoadCard } from "../components/EstimatedLoadCard";
import { ActivityCard } from "../components/ActivityCard";
import { RecoveryCheckInModal } from "../components/RecoveryCheckInModal";
import { RecoveryDetailModal } from "../components/RecoveryDetailModal";
import { RecoveryScoreCard } from "../components/RecoveryScoreCard";
import { SectionHeader } from "../components/SectionHeader";
import { TrainingSessionCard } from "../components/TrainingSessionCard";
import { TrainingStateView } from "../components/TrainingStateView";
import { TrainingSummary } from "../components/TrainingSummary";
import { useRecovery } from "../context/RecoveryContext";
import { useIntegrations } from "../context/IntegrationContext";
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
import {
  calculateReadiness,
  getEstimatedLoad,
  getRecoveryHistory,
} from "../utils/recoveryAnalytics";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export function HomeScreen({ navigation }) {
  const { sessions, isLoading, error, reloadTrainingPlan } = useTraining();
  const recovery = useRecovery();
  const integration = useIntegrations();
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
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
  const todayCheckIn = recovery.checkIns.find((item) => item.date === today) ?? null;
  const readiness = calculateReadiness(todayCheckIn, recovery.checkIns, sessions, recovery.settings);
  const estimatedLoad = getEstimatedLoad(sessions, now);
  const recoveryHistory = getRecoveryHistory(recovery.checkIns, sessions, recovery.settings, 7, now);
  const todayActivities = integration.activities.filter((item) => item.startDate === today && item.syncStatus !== "deleted");
  const latestActivity = integration.activities.find((item) => item.syncStatus !== "deleted") ?? null;

  function openTraining(date = today, sessionId = null) {
    navigation.navigate(
      "Training",
      createTrainingNavigationRequest(date, sessionId),
    );
  }

  if (isLoading || recovery.isLoading) {
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
        {recovery.error ? <TrainingStateView compact error={recovery.error} onRetry={recovery.reloadRecovery} /> : null}

        <IntegrationStatus integration={integration} />

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

        {todayActivities.length ? (
          <>
            <SectionHeader title="Heute absolviert" />
            <View style={styles.sessionList}>{todayActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</View>
          </>
        ) : latestActivity ? (
          <>
            <SectionHeader title="Letzte synchronisierte Aktivität" />
            <ActivityCard activity={latestActivity} />
          </>
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

        <SectionHeader title="Recovery" />
        <View style={styles.metricRow}>
          <RecoveryScoreCard
            readiness={readiness}
            hasCheckIn={Boolean(todayCheckIn)}
            onOpen={() => setDetailVisible(true)}
            onCheckIn={() => setCheckInVisible(true)}
          />
          <EstimatedLoadCard load={estimatedLoad} />
        </View>

        <SectionHeader title="Nächste Rennen" />
        <View style={styles.raceList}>
          {upcomingRaces.length
            ? upcomingRaces.map((race) => <RaceCard key={race.name} race={race} />)
            : <Text style={styles.emptyText}>Aktuell ist kein weiterer Wettkampf hinterlegt.</Text>}
        </View>
      </ScrollView>
      <RecoveryDetailModal
        visible={detailVisible}
        readiness={readiness}
        checkIn={todayCheckIn}
        history={recoveryHistory}
        onClose={() => setDetailVisible(false)}
        onEdit={() => {
          setDetailVisible(false);
          setCheckInVisible(true);
        }}
      />
      <RecoveryCheckInModal
        visible={checkInVisible}
        checkIn={todayCheckIn}
        date={today}
        onSave={recovery.saveCheckIn}
        onClose={() => setCheckInVisible(false)}
      />
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

function IntegrationStatus({ integration }) {
  const label = integration.demo ? "Strava Demo" : "Strava";
  const status = integration.status === "syncing" ? "Synchronisierung läuft"
    : integration.status === "synced" ? "Synchronisiert"
      : integration.connection.connected ? "Verbunden" : "Nicht verbunden";
  const backfill = integration.diagnostics.backfillStatus;
  return <View style={styles.integrationStatus}><View><Text style={styles.integrationLabel}>{label}</Text><Text style={styles.integrationText}>{status}{backfill && backfill !== "unbekannt" ? ` · Backfill ${backfill}` : ""}</Text></View>{integration.lastSync ? <Text style={styles.integrationTime}>{new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(integration.lastSync))}</Text> : null}</View>;
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
  integrationStatus: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.xl, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  integrationLabel: { ...typography.caption, color: colors.textPrimary },
  integrationText: { fontSize: 11, lineHeight: 15, color: colors.textSecondary },
  integrationTime: { fontSize: 10, lineHeight: 14, textAlign: "right", color: colors.textMuted },
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
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  raceList: { gap: spacing.md },
});
