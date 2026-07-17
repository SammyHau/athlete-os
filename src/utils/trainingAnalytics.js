import {
  addWeeks,
  getCalendarWeek,
  getWeekDates,
  intensities,
  sports,
  statuses,
  toISODate,
} from "../data/trainingPlan";

export function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function safePercent(value, total) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function getSessionsForDate(sessions, isoDate) {
  return sessions.filter((session) => session.date === isoDate);
}

export function getSessionsInRange(sessions, startDate, endDate) {
  return sessions.filter(
    (session) => session.date >= startDate && session.date <= endDate,
  );
}

export function getSessionsForWeek(sessions, referenceDate) {
  const days = getWeekDates(referenceDate);
  return getSessionsInRange(sessions, days[0].isoDate, days[6].isoDate);
}

export function getPeriodSessions(sessions, numberOfDays, referenceDate = new Date()) {
  const end = toISODate(referenceDate);
  const start = toISODate(addDays(referenceDate, -(numberOfDays - 1)));
  return getSessionsInRange(sessions, start, end);
}

export function getNextPlannedSession(sessions, fromDate = new Date()) {
  const start = toISODate(fromDate);
  return sessions
    .filter((session) => session.status === "planned" && session.date >= start)
    .slice()
    .sort(compareSessions)[0] ?? null;
}

export function summarizeSessions(sessions) {
  const completed = sessions.filter((session) => session.status === "completed");
  const skipped = sessions.filter((session) => session.status === "skipped");
  const plannedMinutes = sessions.reduce(
    (sum, session) => sum + safeDuration(session.durationMinutes),
    0,
  );
  const completedMinutes = completed.reduce(
    (sum, session) => sum + safeDuration(session.durationMinutes),
    0,
  );
  return {
    totalCount: sessions.length,
    completedCount: completed.length,
    skippedCount: skipped.length,
    plannedMinutes,
    completedMinutes,
    fulfillmentRate: safePercent(completedMinutes, plannedMinutes),
  };
}

export function getSportDistribution(sessions) {
  const completed = sessions.filter((session) => session.status === "completed");
  const totalMinutes = completed.reduce(
    (sum, session) => sum + safeDuration(session.durationMinutes),
    0,
  );
  return sports.map((sport) => {
    const matching = completed.filter((session) => session.sport === sport);
    const minutes = matching.reduce(
      (sum, session) => sum + safeDuration(session.durationMinutes),
      0,
    );
    return {
      key: sport,
      count: matching.length,
      minutes,
      percentage: safePercent(minutes, totalMinutes),
    };
  });
}

export function getIntensityDistribution(sessions) {
  const completed = sessions.filter((session) => session.status === "completed");
  const totalMinutes = completed.reduce(
    (sum, session) => sum + safeDuration(session.durationMinutes),
    0,
  );
  return intensities.map((intensity) => {
    const minutes = completed
      .filter((session) => session.intensity === intensity)
      .reduce((sum, session) => sum + safeDuration(session.durationMinutes), 0);
    return {
      key: intensity,
      minutes,
      percentage: safePercent(minutes, totalMinutes),
    };
  });
}

export function getStatusDistribution(sessions) {
  return statuses.map((status) => ({
    key: status,
    count: sessions.filter((session) => session.status === status).length,
  }));
}

export function getWeeklyTrend(sessions, weeks = 6, referenceDate = new Date()) {
  const currentWeekStart = getWeekDates(referenceDate)[0].date;
  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addWeeks(currentWeekStart, index - (weeks - 1));
    const days = getWeekDates(weekStart);
    const weekSessions = getSessionsInRange(
      sessions,
      days[0].isoDate,
      days[6].isoDate,
    );
    return {
      key: days[0].isoDate,
      calendarWeek: getCalendarWeek(weekStart),
      ...summarizeSessions(weekSessions),
    };
  });
}

export function getConsistency(trend) {
  const activeWeeks = trend.filter((week) => week.completedCount > 0).length;
  return {
    activeWeeks,
    totalWeeks: trend.length,
    percentage: safePercent(activeWeeks, trend.length),
  };
}

export function getRollingWeeks(sessions, count = 4, referenceDate = new Date()) {
  const currentStart = getWeekDates(referenceDate)[0].date;
  return Array.from({ length: count }, (_, index) => {
    const start = addWeeks(currentStart, index);
    const days = getWeekDates(start);
    const weekSessions = getSessionsInRange(
      sessions,
      days[0].isoDate,
      days[6].isoDate,
    );
    return {
      key: days[0].isoDate,
      calendarWeek: getCalendarWeek(start),
      days,
      sessions: weekSessions,
      summary: summarizeSessions(weekSessions),
      sports: sports.map((sport) => ({
        sport,
        count: weekSessions.filter((session) => session.sport === sport).length,
      })).filter((item) => item.count > 0),
    };
  });
}

export function createTrainingNavigationRequest(date, sessionId = null) {
  return {
    selectedDate: date,
    sessionId,
    requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function formatMinutes(minutes) {
  const safeMinutes = safeDuration(minutes);
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  if (!hours) {
    return `${rest} min`;
  }
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function safeDuration(value) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function compareSessions(left, right) {
  const dateComparison = left.date.localeCompare(right.date);
  return dateComparison || left.title.localeCompare(right.title, "de");
}
