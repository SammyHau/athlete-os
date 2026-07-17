import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { TrainingDetailModal } from "../components/TrainingDetailModal";
import { TrainingFormModal } from "../components/TrainingFormModal";
import { TrainingSessionCard } from "../components/TrainingSessionCard";
import { TrainingSummary } from "../components/TrainingSummary";
import { TrainingWeekNavigation } from "../components/TrainingWeekNavigation";
import { TrainingWeekPicker } from "../components/TrainingWeekPicker";
import {
  addWeeks,
  createEmptyTrainingSession,
  getWeekDates,
  toISODate,
} from "../data/trainingPlan";
import { useTrainingPlan } from "../hooks/useTrainingPlan";
import { colors, radius, spacing, typography } from "../theme";

export function TrainingScreen() {
  const {
    sessions,
    isLoading,
    error,
    createSession,
    updateSession,
    deleteSession,
    duplicateSession,
    toggleSessionStatus,
  } = useTrainingPlan();
  const [weekReference, setWeekReference] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [formState, setFormState] = useState(null);
  const weekDates = useMemo(
    () => getWeekDates(weekReference),
    [weekReference],
  );
  const today = toISODate(new Date());
  const weekStart = weekDates[0].isoDate;
  const weekEnd = weekDates[6].isoDate;
  const weekSessions = sessions.filter(
    (session) => session.date >= weekStart && session.date <= weekEnd,
  );
  const selectedSessions = weekSessions.filter(
    (session) => session.date === selectedDate,
  ).sort((a, b) => a.title.localeCompare(b.title, "de"));
  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  ) ?? null;
  const selectedDay = weekDates.find((day) => day.isoDate === selectedDate)?.date;

  function changeWeek(amount) {
    const selectedIndex = Math.max(
      0,
      weekDates.findIndex((day) => day.isoDate === selectedDate),
    );
    const nextReference = addWeeks(weekDates[0].date, amount);
    const nextDays = getWeekDates(nextReference);
    setWeekReference(nextReference);
    setSelectedDate(nextDays[selectedIndex].isoDate);
    setSelectedSessionId(null);
  }

  function goToCurrentWeek() {
    const now = new Date();
    setWeekReference(now);
    setSelectedDate(toISODate(now));
    setSelectedSessionId(null);
  }

  function openCreateForm() {
    setFormState({
      mode: "create",
      session: createEmptyTrainingSession(selectedDate),
    });
  }

  function openEditForm() {
    if (!selectedSession) {
      return;
    }
    setFormState({ mode: "edit", session: selectedSession });
    setSelectedSessionId(null);
  }

  function openDuplicateForm() {
    if (!selectedSession) {
      return;
    }
    const draft = duplicateSession(selectedSession.id);
    if (draft) {
      setFormState({ mode: "duplicate", session: draft });
      setSelectedSessionId(null);
    }
  }

  function saveForm(draft) {
    const saved = formState.mode === "edit"
      ? updateSession(formState.session.id, draft)
      : createSession(draft);
    if (saved) {
      setFormState(null);
    }
  }

  function confirmDelete() {
    if (!selectedSession) {
      return;
    }
    const session = selectedSession;
    Alert.alert(
      "Einheit löschen?",
      `„${session.title}“ wird dauerhaft aus deinem Trainingsplan entfernt.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            deleteSession(session.id);
            setSelectedSessionId(null);
          },
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={styles.loadingText}>Trainingsplan wird geladen</Text>
      </SafeAreaView>
    );
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
            <Text style={styles.label}>TRAININGSPLANER</Text>
            <Text style={styles.title}>Training</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Einheit hinzufügen"
          onPress={openCreateForm}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={22} color={colors.black} />
          <Text style={styles.addButtonText}>Einheit hinzufügen</Text>
        </Pressable>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <TrainingWeekNavigation
          days={weekDates}
          onPrevious={() => changeWeek(-1)}
          onNext={() => changeWeek(1)}
          onToday={goToCurrentWeek}
        />

        <TrainingWeekPicker
          days={weekDates}
          selectedDate={selectedDate}
          today={today}
          onSelect={setSelectedDate}
        />

        <View style={styles.summarySection}>
          <TrainingSummary sessions={weekSessions} />
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
        onToggleStatus={() => toggleSessionStatus(selectedSessionId)}
        onEdit={openEditForm}
        onDuplicate={openDuplicateForm}
        onDelete={confirmDelete}
      />

      {formState ? (
        <TrainingFormModal
          visible
          mode={formState.mode}
          initialSession={formState.session}
          onCancel={() => setFormState(null)}
          onSave={saveForm}
        />
      ) : null}
    </SafeAreaView>
  );
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
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
  addButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  addButtonText: {
    ...typography.caption,
    color: colors.black,
  },
  pressed: {
    opacity: 0.68,
  },
  errorBanner: {
    ...typography.caption,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.sm,
    color: colors.danger,
    backgroundColor: colors.surface,
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
