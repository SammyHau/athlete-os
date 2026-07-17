class InMemoryActivityRepository {
  constructor() { this.activities = new Map(); this.syncs = new Map(); }
  key(userId, provider, externalId) { return `${userId}:${provider}:${externalId}`; }
  async upsert(userId, activity) {
    const key = this.key(userId, activity.provider, activity.externalId);
    const existing = this.activities.get(key);
    this.activities.set(key, { ...existing, ...activity });
    return existing ? "updated" : "created";
  }
  async getLastSync(userId, provider) { return this.syncs.get(`${userId}:${provider}`) ?? null; }
  async setLastSync(userId, provider, value) { this.syncs.set(`${userId}:${provider}`, value); }
  async list(userId, provider) { return [...this.activities.entries()].filter(([key]) => key.startsWith(`${userId}:${provider}:`)).map(([, value]) => value); }
}

module.exports = { InMemoryActivityRepository };
