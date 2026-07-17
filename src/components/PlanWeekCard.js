import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { sportMeta, statusMeta, toISODate } from "../data/trainingPlan";
import { colors, radius, spacing, typography } from "../theme";
import {
  formatMinutes,
  getSessionsForDate,
  summarizeSessions,
} from "../utils/trainingAnalytics";

const rangeStartFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
});
const rangeEndFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

export function PlanWeekCard({
  week,
  expanded,
  sportFilter,
  statusFilter,
  onToggle,
  onOpenDay,
  onOpenSession,
}) {
  const today = toISODate(new Date());
  const current = week.days.some((day) => day.isoDate === today);
  const filtered = week.sessions.filter((session) => (
    (sportFilter === "all" || session.sport === sportFilter)
    && (statusFilter === "all" || session.status === statusFilter)
  ));

  return (
    <View style={[styles.card, current && styles.currentCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Kalenderwoche ${week.calendarWeek} ${expanded ? "schließen" : "öffnen"}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.headerText}>
          <View style={styles.weekline}>
            <Text style={styles.week}>KW {week.calendarWeek}</Text>
            {current ? <Text style={styles.currentLabel}>AKTUELL</Text> : null}
          </View>
          <Text style={styles.range}>
            {rangeStartFormatter.format(week.days[0].date)} – {rangeEndFormatter.format(week.days[6].date)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      <View style={styles.summaryRow}>
        <SummaryValue value={week.summary.totalCount} label="Einheiten" />
        <SummaryValue value={formatMinutes(week.summary.plannedMinutes)} label="Geplant" />
        <SummaryValue value={formatMinutes(week.summary.completedMinutes)} label="Erledigt" />
      </View>

      <View style={styles.sports}>
        {week.sports.length ? week.sports.map((item) => (
          <Text key={item.sport} style={styles.sportText}>
            {sportMeta[item.sport].label} {item.count}
          </Text>
        )) : <Text style={styles.emptyMeta}>Keine Sportarten geplant</Text>}
      </View>

      {expanded ? (
        <View style={styles.days}>
          {week.days.map((day) => {
            const daySessions = getSessionsForDate(filtered, day.isoDate);
            const summary = summarizeSessions(daySessions);
            const isToday = day.isoDate === today;
            return (
              <View key={day.isoDate} style={styles.day}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${dayFormatter.format(day.date)} im Training öffnen`}
                  onPress={() => onOpenDay(day.isoDate)}
                  style={({ pressed }) => [styles.dayHeader, pressed && styles.pressed]}
                >
                  <View style={styles.dayTitleRow}>
                    <Text style={styles.dayTitle}>{dayFormatter.format(day.date)}</Text>
                    {isToday ? <Text style={styles.todayLabel}>HEUTE</Text> : null}
                  </View>
                  <Text style={styles.dayMeta}>
                    {summary.totalCount} Einheiten · {summary.completedCount} erledigt · {formatMinutes(summary.plannedMinutes)}
                  </Text>
                </Pressable>
                {daySessions.length ? (
                  <View style={styles.sessionList}>
                    {daySessions.map((session) => (
                      <Pressable
                        key={session.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${session.title} im Training öffnen`}
                        onPress={() => onOpenSession(session)}
                        style={({ pressed }) => [styles.session, pressed && styles.pressed]}
                      >
                        <Ionicons
                          name={sportMeta[session.sport].icon}
                          size={17}
                          color={colors.textPrimary}
                        />
                        <View style={styles.sessionText}>
                          <Text style={styles.sessionTitle}>{session.title}</Text>
                          <Text style={styles.sessionMeta}>
                            {session.durationMinutes} min · {statusMeta[session.status].label}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyDay}>Keine passenden Einheiten</Text>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function SummaryValue({ value, label }) {
  return (
    <View style={styles.summaryValue}>
      <Text style={styles.summaryNumber}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  currentCard: { borderColor: colors.textPrimary },
  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerText: { flex: 1 },
  weekline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  week: { ...typography.title, color: colors.textPrimary },
  currentLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  range: { ...typography.caption, marginTop: spacing.xs, color: colors.textSecondary },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  summaryValue: { flex: 1, minWidth: 0 },
  summaryNumber: { fontSize: 15, lineHeight: 20, fontWeight: "800", color: colors.textPrimary },
  summaryLabel: { fontSize: 10, lineHeight: 14, marginTop: spacing.xs, color: colors.textSecondary },
  sports: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sportText: { ...typography.caption, color: colors.textSecondary },
  emptyMeta: { ...typography.caption, color: colors.textMuted },
  days: { borderTopWidth: 1, borderColor: colors.border },
  day: { padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border },
  dayHeader: { minHeight: 44, justifyContent: "center" },
  dayTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dayTitle: { ...typography.caption, color: colors.textPrimary },
  todayLabel: { fontSize: 9, lineHeight: 12, fontWeight: "800", color: colors.textSecondary },
  dayMeta: { fontSize: 11, lineHeight: 15, marginTop: spacing.xs, color: colors.textSecondary },
  sessionList: { gap: spacing.sm, marginTop: spacing.sm },
  session: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  sessionText: { flex: 1, minWidth: 0 },
  sessionTitle: { ...typography.caption, color: colors.textPrimary },
  sessionMeta: { fontSize: 11, lineHeight: 15, marginTop: spacing.xs, color: colors.textSecondary },
  emptyDay: { ...typography.caption, marginTop: spacing.sm, color: colors.textMuted },
  pressed: { opacity: 0.68 },
});
