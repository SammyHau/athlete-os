import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { TrainingDetailModal } from "../components/TrainingDetailModal";
import { TrainingSessionCard } from "../components/TrainingSessionCard";
import { TrainingSummary } from "../components/TrainingSummary";
import { TrainingWeekPicker } from "../components/TrainingWeekPicker";
import {
  createDemoTrainingPlan,
  getCalendarWeek,
  getWeekDates,
  toISODate,
} from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";

export function TrainingScreen() {
  const [sessions, setSessions] = useState(() => createDemoTrainingPlan());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const weekDates = useMemo(() => getWeekDates(), []);
  const today = toISODate(new Date());
  const selectedSessions = sessions.filter(
    (session) => session.date === selectedDate,
  );
  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  ) ?? null;
  const selectedDay = weekDates.find((day) => day.isoDate === selectedDate)?.date;

  function toggleSelectedSession() {
    if (!selectedSessionId) {
      return;
    }

    setSessions((current) => current.map((session) => {
      if (session.id !== selectedSessionId) {
        return session;
      }

      return {
        ...session,
        status: session.status === "completed" ? "planned" : "completed",
      };
    }));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>DEINE WOCHE</Text>
            <Text style={styles.title}>Training</Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeLabel}>KW</Text>
            <Text style={styles.weekBadgeValue}>{getCalendarWeek(weekDates[0].date)}</Text>
          </View>
        </View>

        <Text style={styles.weekRange}>
          {formatWeekRange(weekDates)}
        </Text>

        <TrainingWeekPicker
          days={weekDates}
          selectedDate={selectedDate}
          today={today}
          onSelect={setSelectedDate}
        />

        <View style={styles.summarySection}>
          <TrainingSummary sessions={sessions} />
        </View>

        <View style={styles.dayHeader}>
          <View>
            <Text style={styles.dayEyebrow}>TAGESPLAN</Text>
            <Text style={styles.dayTitle}>
              {selectedDay
                ? formatSelectedDay(selectedDay, selectedDate === today)
                : "Ausgewählter Tag"}
            </Text>
          </View>
          <Text style={styles.dayCount}>{selectedSessions.length} Einheiten</Text>
        </View>

        {selectedSessions.length ? (
          <View style={styles.sessionList}>
            {selectedSessions.map((session) => (
              <TrainingSessionCard
                key={session.id}
                session={session}
                onPress={() => setSelectedSessionId(session.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="moon-outline"
                size={24}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>Kein Training geplant</Text>
            <Text style={styles.emptyText}>
              Dieser Tag bleibt frei für Erholung und spontane Bewegung.
            </Text>
          </View>
        )}
      </ScrollView>

      <TrainingDetailModal
        session={selectedSession}
        visible={Boolean(selectedSession)}
        onClose={() => setSelectedSessionId(null)}
        onToggleStatus={toggleSelectedSession}
      />
    </SafeAreaView>
  );
}

function formatWeekRange(weekDates) {
  const start = weekDates[0].date;
  const end = weekDates[6].date;
  const startText = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
  }).format(start);
  const endText = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(end);
  return `${startText} – ${endText}`;
}

function formatSelectedDay(date, isToday) {
  if (isToday) {
    return "Heute";
  }

  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
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
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  weekBadge: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  weekBadgeLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "800",
    color: colors.textMuted,
  },
  weekBadgeValue: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.white,
  },
  weekRange: {
    ...typography.caption,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  summarySection: {
    marginTop: spacing.lg,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  dayEyebrow: {
    ...typography.label,
    color: colors.textMuted,
  },
  dayTitle: {
    ...typography.title,
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
  dayCount: {
    ...typography.caption,
    flexShrink: 0,
    color: colors.textSecondary,
  },
  sessionList: {
    gap: spacing.md,
  },
  emptyState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginTop: spacing.md,
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.caption,
    maxWidth: 250,
    textAlign: "center",
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
});
