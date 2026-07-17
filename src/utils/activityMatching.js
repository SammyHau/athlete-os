const SPORT_MAP = { run: "run", bike: "bike", swim: "swim", strength: "strength" };

export function scoreActivityMatch(activity, session) {
  if (!activity || !session || activity.startDate !== session.date || SPORT_MAP[session.sport] !== activity.sport) return { score: 0, status: "unmatched", reasons: [] };
  const actualMinutes = (activity.movingTimeSeconds ?? activity.durationSeconds) / 60;
  const durationRatio = Math.min(actualMinutes, session.durationMinutes) / Math.max(actualMinutes, session.durationMinutes);
  const titleScore = tokenSimilarity(activity.name, session.title);
  const startHour = new Date(activity.startDateTime).getHours();
  const plannedHour = typeof session.startTime === "string" ? Number(session.startTime.split(":")[0]) : null;
  const timeScore = Number.isFinite(plannedHour) ? Math.max(0, 1 - Math.abs(startHour - plannedHour) / 6) : 0.5;
  const structureScore = session.workoutSteps?.length ? Math.min(1, (activity.laps?.length || 0) / session.workoutSteps.length) : 0.5;
  const score = typeof session.title !== "string"
    ? Math.round(durationRatio * 100)
    : Math.round((durationRatio * 0.45 + titleScore * 0.25 + timeScore * 0.15 + structureScore * 0.15) * 100);
  return { score, status: score >= 80 ? "automatic" : score >= 60 ? "probable" : "manual_required", reasons: ["Datum und Sportart stimmen überein", `Dauerähnlichkeit ${Math.round(durationRatio * 100)} %`] };
}

export function findBestActivityMatch(activity, sessions) { const candidates = sessions.map((session) => ({ sessionId: session.id, ...scoreActivityMatch(activity, session) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score); return candidates[0] ?? { sessionId: null, score: 0, status: "unmatched", reasons: [] }; }
export function linkActivity(activities, activityId, sessionId, status = "manual") { return activities.map((activity) => activity.id === activityId ? { ...activity, plannedSessionId: sessionId, matchStatus: sessionId ? status : "unmatched" } : activity); }
function tokenSimilarity(left, right) { const a = new Set(String(left).toLowerCase().split(/\W+/).filter(Boolean)); const b = new Set(String(right).toLowerCase().split(/\W+/).filter(Boolean)); if (!a.size || !b.size) return 0; return [...a].filter((token) => b.has(token)).length / new Set([...a, ...b]).size; }
