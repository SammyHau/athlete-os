class InMemoryTokenStore {
  constructor() { this.records = new Map(); }
  async get(userId) { return this.records.get(userId) ?? null; }
  async set(userId, token) { this.records.set(userId, { ...token }); }
  async delete(userId) { this.records.delete(userId); }
}

function isTokenExpired(token, nowSeconds = Math.floor(Date.now() / 1000), skewSeconds = 3600) {
  return !token || !Number.isFinite(token.expiresAt) || token.expiresAt <= nowSeconds + skewSeconds;
}

module.exports = { InMemoryTokenStore, isTokenExpired };
