import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { TrainingDetailModal } from "../components/TrainingDetailModal";
import { ActivityCard } from "../components/ActivityCard";
import { ActivityDetailModal } from "../components/ActivityDetailModal";
import { FilterChips } from "../components/FilterChips";
import { TrainingFormModal } from "../components/TrainingFormModal";
import { TrainingSessionCard } from "../components/TrainingSessionCard";
import { TrainingStateView } from "../components/TrainingStateView";
import { TrainingSummary } from "../components/TrainingSummary";
import { TrainingWeekNavigation } from "../components/TrainingWeekNavigation";
import { TrainingWeekPicker } from "../components/TrainingWeekPicker";
import { useTraining } from "../context/TrainingContext";
import { useIntegrations } from "../context/IntegrationContext";
import {
  addWeeks,
  createEmptyTrainingSession,
  getWeekDates,
  isISODate,
  toISODate,
} from "../data/trainingPlan";
import { parseISODate } from "../utils/trainingAnalytics";
import { colors, radius, spacing, typography } from "../theme";

export function TrainingScreen({ navigation, route }) {
  const integration = useIntegrations();
  const {
    sessions,
    isLoading,
    error,
    createSession,
    updateSession,
    deleteSession,
    duplicateSession,
    toggleSessionStatus,
    reloadTrainingPlan,
  } = useTraining();
  const [weekReference, setWeekReference] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [formState, setFormState] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [historySport, setHistorySport] = useState("all");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyLimit, setHistoryLimit] = useState(20);
  const lastRequestId = useRef(null);
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
  const selectedActivities = integration.activities.filter(
    (activity) => activity.startDate === selectedDate && activity.syncStatus !== "deleted",
  );
  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  ) ?? null;
  const selectedDay = weekDates.find((day) => day.isoDate === selectedDate)?.date;
  const selectedActivity = integration.activities.find((activity) => activity.id === selectedActivityId) ?? null;
  const history = integration.activities.filter((activity) => activity.syncStatus !== "deleted" && (historySport === "all" || activity.sport === historySport) && activity.name.toLowerCase().includes(historyQuery.trim().toLowerCase())).slice(0, historyLimit);

  useEffect(() => {
    const request = route.params;
    if (
      isLoading
      || !request?.requestId
      || request.requestId === lastRequestId.current
      || !isISODate(request.selectedDate)
    ) {
      return;
    }

    lastRequestId.current = request.requestId;
    setWeekReference(parseISODate(request.selectedDate));
    setSelectedDate(request.selectedDate);
    setSelectedSessionId(
      request.sessionId && sessions.some((item) => item.id === request.sessionId)
        ? request.sessionId
        : null,
    );
  }, [isLoading, route.params, sessions]);

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

        {error ? <TrainingStateView compact error={error} onRetry={reloadTrainingPlan} /> : null}

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trainingsfortschritt öffnen"
            onPress={() => navigation.navigate("Progress")}
            style={({ pressed }) => [styles.progressLink, pressed && styles.pressed]}
          >
            <Text style={styles.progressLinkText}>Fortschritt ansehen</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
          </Pressable>
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
                linkedActivity={selectedActivities.find((activity) => activity.plannedSessionId === session.id) ?? null}
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

        {selectedActivities.length ? (
          <View style={styles.actualSection}>
            <Text style={styles.dayEyebrow}>TATSÄCHLICH ABSOLVIERT</Text>
            <View style={styles.sessionList}>
              {selectedActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} onPress={() => { setSelectedActivityId(activity.id); integration.loadActivityDetails(activity); }} />)}
            </View>
          </View>
        ) : null}

        <View style={styles.historySection}>
          <Text style={styles.dayEyebrow}>AKTIVITÄTSHISTORIE</Text>
          <TextInput accessibilityLabel="Aktivitäten durchsuchen" value={historyQuery} onChangeText={setHistoryQuery} placeholder="Nach Trainingsname suchen" placeholderTextColor={colors.textMuted} style={styles.searchInput} />
          <FilterChips label="Sportart" value={historySport} onChange={setHistorySport} options={[{ value: "all", label: "Alle" }, { value: "run", label: "Laufen" }, { value: "bike", label: "Rad" }, { value: "swim", label: "Schwimmen" }, { value: "strength", label: "Kraft" }]} />
          {history.length ? <View style={styles.sessionList}>{history.map((activity) => <ActivityCard key={`history-${activity.id}`} activity={activity} onPress={() => { setSelectedActivityId(activity.id); integration.loadActivityDetails(activity); }} />)}</View> : <Text style={styles.emptyText}>Keine tatsächlichen Aktivitäten entsprechen diesem Filter.</Text>}
          {history.length < integration.activities.length ? <Pressable accessibilityRole="button" accessibilityLabel="Weitere Aktivitäten laden" onPress={() => setHistoryLimit((value) => value + 20)} style={styles.loadMore}><Text style={styles.progressLinkText}>Weitere Aktivitäten laden</Text></Pressable> : null}
        </View>
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
      <ActivityDetailModal activity={selectedActivity} cache={selectedActivity ? integration.activityDetails[selectedActivity.id] : null} error={selectedActivity ? integration.detailErrors[selectedActivity.id] : null} visible={Boolean(selectedActivity)} onClose={() => setSelectedActivityId(null)} onLoad={() => integration.loadActivityDetails(selectedActivity)} onLoadStreams={() => integration.loadActivityDetails(selectedActivity, { streams: true })} onRefresh={() => integration.loadActivityDetails(selectedActivity, { streams: true, refresh: true })} matchingSessions={selectedActivity ? sessions.filter((session) => session.date === selectedActivity.startDate && session.sport === selectedActivity.sport) : []} onMatch={(sessionId) => integration.setActivityMatch(selectedActivity.id, sessionId)} />
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  historySection: { marginTop: spacing.xxl, gap: spacing.md },
  searchInput: { minHeight: 48, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.textPrimary },
  loadMore: { minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
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
  progressLink: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  progressLinkText: { ...typography.caption, color: colors.textPrimary },
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
  actualSection: { gap: spacing.md, marginTop: spacing.xxl },
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
