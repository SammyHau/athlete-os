import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilterChips } from "../components/FilterChips";
import { PlanWeekCard } from "../components/PlanWeekCard";
import { RaceCard } from "../components/RaceCard";
import { SectionHeader } from "../components/SectionHeader";
import { TrainingStateView } from "../components/TrainingStateView";
import { useTraining } from "../context/TrainingContext";
import { races } from "../data/races";
import { sportMeta, sports, statusMeta, statuses, toISODate } from "../data/trainingPlan";
import { colors, spacing, typography } from "../theme";
import {
  createTrainingNavigationRequest,
  getRollingWeeks,
} from "../utils/trainingAnalytics";

export function PlanScreen({ navigation, route }) {
  const { sessions, isLoading, error, reloadTrainingPlan } = useTraining();
  const weeks = useMemo(() => getRollingWeeks(sessions, 4), [sessions]);
  const [expandedWeek, setExpandedWeek] = useState(() => weeks[0]?.key ?? null);
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const lastFocusRequest = useRef(null);

  useEffect(() => {
    if (!route.params?.focusCurrent || route.params.focusCurrent === lastFocusRequest.current) {
      return;
    }
    lastFocusRequest.current = route.params.focusCurrent;
    setExpandedWeek(weeks[0]?.key ?? null);
  }, [route.params, weeks]);

  function openTraining(date, sessionId = null) {
    navigation.navigate(
      "Training",
      createTrainingNavigationRequest(date, sessionId),
    );
  }

  if (isLoading) {
    return <TrainingStateView loading />;
  }

  const upcomingRaces = races.filter((race) => race.dateISO >= toISODate(new Date()));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>VIER WOCHEN</Text>
        <Text style={styles.title}>Plan</Text>
        <Text style={styles.intro}>
          Belastung strukturieren, freie Tage erkennen und Einheiten gezielt öffnen.
        </Text>

        {error ? (
          <TrainingStateView compact error={error} onRetry={reloadTrainingPlan} />
        ) : null}

        <View style={styles.filters}>
          <FilterChips
            label="Sportart"
            value={sportFilter}
            onChange={setSportFilter}
            options={[
              { value: "all", label: "Alle" },
              ...sports.map((sport) => ({ value: sport, label: sportMeta[sport].label })),
            ]}
          />
          <FilterChips
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Alle" },
              ...statuses.map((status) => ({ value: status, label: statusMeta[status].label })),
            ]}
          />
        </View>

        <View style={styles.weeks}>
          {weeks.map((week) => (
            <PlanWeekCard
              key={week.key}
              week={week}
              expanded={expandedWeek === week.key}
              sportFilter={sportFilter}
              statusFilter={statusFilter}
              onToggle={() => setExpandedWeek((current) => current === week.key ? null : week.key)}
              onOpenDay={(date) => openTraining(date)}
              onOpenSession={(session) => openTraining(session.date, session.id)}
            />
          ))}
        </View>

        {upcomingRaces.length ? (
          <View style={styles.races}>
            <SectionHeader title="Bevorstehende Wettkämpfe" />
            <View style={styles.raceList}>
              {upcomingRaces.map((race) => <RaceCard key={race.name} race={race} />)}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
  label: { ...typography.label, color: colors.textSecondary },
  title: { ...typography.headline, marginTop: spacing.xs, color: colors.textPrimary },
  intro: {
    ...typography.body,
    maxWidth: 340,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  filters: { marginTop: spacing.xxl },
  weeks: { gap: spacing.md },
  races: { marginTop: spacing.xxl },
  raceList: { gap: spacing.md },
});
