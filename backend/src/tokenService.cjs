const { isTokenExpired } = require("./tokenStore.cjs");

class TokenService {
  constructor(store, client) { this.store = store; this.client = client; }
  async saveExchange(userId, token) { await this.store.set(userId, token); return publicConnection(token); }
  async getValidToken(userId) {
    const current = await this.store.get(userId);
    if (!current) throw Object.assign(new Error("Strava ist nicht verbunden."), { statusCode: 401, code: "connection_expired" });
    if (!isTokenExpired(current)) return current;
    try {
      const refreshed = await this.client.refreshToken(current.refreshToken);
      const next = { ...current, ...refreshed, athlete: refreshed.athlete ?? current.athlete };
      await this.store.set(userId, next);
      return next;
    } catch (error) {
      await this.store.delete(userId);
      throw Object.assign(new Error("Die Strava-Verbindung ist abgelaufen. Bitte erneut verbinden."), { statusCode: 401, code: "connection_expired", cause: error });
    }
  }
  async status(userId) { const token = await this.store.get(userId); return token ? publicConnection(token) : { connected: false }; }
  async disconnect(userId) {
    const token = await this.store.get(userId);
    if (token) await this.client.deauthorize(token.refreshToken, "refresh_token");
    await this.store.delete(userId);
  }
}

function publicConnection(token) {
  return { connected: true, expiresAt: token.expiresAt, athlete: token.athlete ? { id: token.athlete.id, firstname: token.athlete.firstname, lastname: token.athlete.lastname, profile: token.athlete.profile } : null };
}

module.exports = { TokenService, publicConnection };
