const { normalizeStravaActivity } = require("./stravaMapping.cjs");

class StravaSyncService {
  constructor({ client, tokenService, repository, config }) { Object.assign(this, { client, tokenService, repository, config }); }
  async sync(userId, now = new Date(), options = {}) {
    const token = await this.tokenService.getValidToken(userId);
    const state = await this.repository.getSyncState(userId, "strava");
    const isBackfill = options.backfill !== false && !state.backfillComplete;
    const startPage = isBackfill ? (state.backfillNextPage || 1) : 1;
    const pageBudget = isBackfill ? (this.config.backfillPagesPerRun || this.config.syncPageLimit) : this.config.syncPageLimit;
    const after = isBackfill ? undefined : Math.floor(new Date(state.lastSuccessfulSync).getTime() / 1000) - 86400;
    const result = { created: 0, updated: 0, skipped: 0, errors: 0, activities: [], lastSuccessfulSync: state.lastSuccessfulSync ?? null, rateLimit: state.rateLimit ?? null, backfill: { status: isBackfill ? "running" : "complete", nextPage: startPage, importedCount: state.importedCount || 0, oldestImportedAt: state.oldestImportedAt ?? null, pausedForRateLimit: false } };
    for (let offset = 0; offset < pageBudget; offset += 1) {
      const page = isBackfill ? startPage + offset : offset + 1;
      const response = await this.client.listActivities(token.accessToken, { after, page, perPage: this.config.syncPageSize });
      result.rateLimit = response.rateLimit;
      if (!Array.isArray(response.data)) throw Object.assign(new Error("Strava hat ungültige Aktivitätsdaten geliefert."), { statusCode: 502 });
      for (const raw of response.data) {
        const activity = normalizeStravaActivity(raw, now.toISOString());
        if (!activity) { result.errors += 1; continue; }
        const operation = await this.repository.upsert(userId, activity);
        result[operation] += 1;
        result.activities.push(activity);
        if (!result.backfill.oldestImportedAt || activity.startDateTime < result.backfill.oldestImportedAt) result.backfill.oldestImportedAt = activity.startDateTime;
      }
      result.backfill.importedCount += response.data.length;
      result.backfill.nextPage = page + 1;
      if (isRateLimitNear(response.rateLimit)) { result.backfill.status = "paused"; result.backfill.pausedForRateLimit = true; break; }
      if (response.data.length < this.config.syncPageSize) { result.backfill.status = "complete"; result.backfill.nextPage = null; break; }
      if (!isBackfill && offset === pageBudget - 1) result.skipped += 1;
    }
    if (!isBackfill || result.backfill.status === "complete") result.lastSuccessfulSync = now.toISOString();
    await this.repository.setSyncState(userId, "strava", { lastSuccessfulSync: result.lastSuccessfulSync, backfillComplete: result.backfill.status === "complete", backfillNextPage: result.backfill.nextPage, importedCount: result.backfill.importedCount, oldestImportedAt: result.backfill.oldestImportedAt, rateLimit: result.rateLimit, pausedForRateLimit: result.backfill.pausedForRateLimit });
    return result;
  }
  async status(userId) { return this.repository.getSyncState(userId, "strava"); }
  async cancelBackfill(userId) { const state = await this.status(userId); await this.repository.setSyncState(userId, "strava", { ...state, backfillPausedByUser: true }); return { ...state, backfillPausedByUser: true }; }
}

function isRateLimitNear(rateLimit) {
  const limits = String(rateLimit?.limit || "").split(",").map(Number);
  const usage = String(rateLimit?.usage || "").split(",").map(Number);
  return limits.some((limit, index) => Number.isFinite(limit) && limit > 0 && Number.isFinite(usage[index]) && usage[index] / limit >= 0.9);
}

module.exports = { StravaSyncService, isRateLimitNear };
