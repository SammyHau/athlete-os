const { normalizeStravaActivity } = require("./stravaMapping.cjs");

class StravaSyncService {
  constructor({ client, tokenService, repository, config }) { Object.assign(this, { client, tokenService, repository, config }); }
  async sync(userId, now = new Date()) {
    const token = await this.tokenService.getValidToken(userId);
    const lastSync = await this.repository.getLastSync(userId, "strava");
    const ninetyDaysAgo = Math.floor((now.getTime() - 90 * 86400000) / 1000);
    const after = lastSync ? Math.max(ninetyDaysAgo, Math.floor(new Date(lastSync).getTime() / 1000) - 86400) : ninetyDaysAgo;
    const result = { created: 0, updated: 0, skipped: 0, errors: 0, activities: [], lastSuccessfulSync: null, rateLimit: null };
    for (let page = 1; page <= this.config.syncPageLimit; page += 1) {
      const response = await this.client.listActivities(token.accessToken, { after, page, perPage: this.config.syncPageSize });
      result.rateLimit = response.rateLimit;
      if (!Array.isArray(response.data)) throw Object.assign(new Error("Strava hat ungültige Aktivitätsdaten geliefert."), { statusCode: 502 });
      for (const raw of response.data) {
        const activity = normalizeStravaActivity(raw, now.toISOString());
        if (!activity) { result.errors += 1; continue; }
        const operation = await this.repository.upsert(userId, activity);
        result[operation] += 1;
        result.activities.push(activity);
      }
      if (response.data.length < this.config.syncPageSize) break;
      if (page === this.config.syncPageLimit) result.skipped += 1;
    }
    result.lastSuccessfulSync = now.toISOString();
    await this.repository.setLastSync(userId, "strava", result.lastSuccessfulSync);
    return result;
  }
}

module.exports = { StravaSyncService };
