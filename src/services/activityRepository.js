import { normalizeActivity } from "../data/activity";

const TRAINING_TO_ACTIVITY_SPORT = { run: "run", bike: "bike", swim: "swim", strength: "strength" };

export function reconcileActivities(existing, incoming, plannedSessions) {
  const byKey = new Map(existing.map((item) => [`${item.provider}:${item.externalId}`, item]));
  const result = { created: 0, updated: 0, skipped: 0, errors: 0, activities: [] };
  incoming.forEach((value) => {
    const activity = normalizeActivity(value);
    if (!activity) { result.errors += 1; return; }
    const key = `${activity.provider}:${activity.externalId}`;
    const previous = byKey.get(key);
    const plannedSessionId = previous?.plannedSessionId ?? findPlannedSession(activity, plannedSessions, [...byKey.values()]);
    const next = { ...previous, ...activity, plannedSessionId };
    if (!previous) result.created += 1;
    else if (activityFingerprint(previous) === activityFingerprint(next)) result.skipped += 1;
    else result.updated += 1;
    byKey.set(key, next);
  });
  result.activities = [...byKey.values()].sort((a, b) => b.startDateTime.localeCompare(a.startDateTime));
  return result;
}

export function findPlannedSession(activity, sessions, linkedActivities = []) {
  const linked = new Set(linkedActivities.map((item) => item.plannedSessionId).filter(Boolean));
  const candidates = sessions.filter((session) => !linked.has(session.id)
    && session.date === activity.startDate
    && TRAINING_TO_ACTIVITY_SPORT[session.sport] === activity.sport);
  if (!candidates.length) return null;
  const durationMinutes = activity.movingTimeSeconds !== null ? activity.movingTimeSeconds / 60 : activity.durationSeconds / 60;
  return candidates.map((session) => ({ session, difference: Math.abs(session.durationMinutes - durationMinutes) }))
    .filter((item) => item.difference <= Math.max(15, item.session.durationMinutes * 0.35))
    .sort((left, right) => left.difference - right.difference)[0]?.session.id ?? null;
}

export function activityFingerprint(activity) {
  return JSON.stringify([activity.name, activity.startDateTime, activity.durationSeconds, activity.movingTimeSeconds, activity.distanceMeters, activity.syncStatus]);
}
