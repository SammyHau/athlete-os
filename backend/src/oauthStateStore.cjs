const crypto = require("node:crypto");

class OAuthStateStore {
  constructor(ttlMs) { this.ttlMs = ttlMs; this.states = new Map(); }
  create(userId, mobileRedirectUri, now = Date.now()) {
    this.purge(now);
    const state = crypto.randomBytes(32).toString("base64url");
    this.states.set(state, { userId, mobileRedirectUri, expiresAt: now + this.ttlMs });
    return state;
  }
  consume(state, now = Date.now()) {
    const record = this.states.get(state);
    this.states.delete(state);
    if (!record || record.expiresAt < now) return null;
    return record;
  }
  purge(now = Date.now()) {
    for (const [key, value] of this.states) if (value.expiresAt < now) this.states.delete(key);
  }
}

module.exports = { OAuthStateStore };
