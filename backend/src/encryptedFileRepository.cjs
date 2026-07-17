const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const FILE_VERSION = 1;

class EncryptedFileRepository {
  constructor(filePath, encryptionKey) {
    if (!encryptionKey) throw new Error("ATHLETEOS_TOKEN_ENCRYPTION_KEY fehlt.");
    this.filePath = filePath;
    this.key = crypto.scryptSync(encryptionKey, "athleteos-local-v1", 32);
    this.data = emptyData();
    this.loaded = false;
    this.writeQueue = Promise.resolve();
  }

  async ensureLoaded() {
    if (this.loaded) return;
    try {
      const envelope = JSON.parse(await fs.readFile(this.filePath, "utf8"));
      this.data = decryptEnvelope(envelope, this.key);
    } catch (error) {
      if (error.code !== "ENOENT") this.corrupted = true;
      this.data = emptyData();
    }
    this.loaded = true;
  }

  async persist() {
    const snapshot = JSON.stringify(this.data);
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const temporary = `${this.filePath}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(encryptPayload(snapshot, this.key)), { encoding: "utf8", mode: 0o600 });
      await fs.rename(temporary, this.filePath);
    });
    return this.writeQueue;
  }

  async get(userId) { await this.ensureLoaded(); return clone(this.data.connections[userId] ?? null); }
  async set(userId, token) { await this.ensureLoaded(); this.data.connections[userId] = clone(token); await this.persist(); }
  async delete(userId) { await this.ensureLoaded(); delete this.data.connections[userId]; await this.persist(); }

  keyFor(userId, provider, externalId) { return `${userId}:${provider}:${externalId}`; }
  async upsert(userId, activity) {
    await this.ensureLoaded();
    const key = this.keyFor(userId, activity.provider, activity.externalId);
    const existing = this.data.activities[key];
    this.data.activities[key] = { ...existing, ...clone(activity) };
    await this.persist();
    return existing ? "updated" : "created";
  }
  async getActivity(userId, provider, externalId) { await this.ensureLoaded(); return clone(this.data.activities[this.keyFor(userId, provider, externalId)] ?? null); }
  async list(userId, provider) { await this.ensureLoaded(); const prefix = `${userId}:${provider}:`; return Object.entries(this.data.activities).filter(([key]) => key.startsWith(prefix)).map(([, value]) => clone(value)); }
  async deleteActivities(userId, provider) { await this.ensureLoaded(); const prefix = `${userId}:${provider}:`; Object.keys(this.data.activities).filter((key) => key.startsWith(prefix)).forEach((key) => delete this.data.activities[key]); await this.persist(); }
  async getLastSync(userId, provider) { return (await this.getSyncState(userId, provider)).lastSuccessfulSync ?? null; }
  async setLastSync(userId, provider, value) { const state = await this.getSyncState(userId, provider); await this.setSyncState(userId, provider, { ...state, lastSuccessfulSync: value }); }
  async getSyncState(userId, provider) { await this.ensureLoaded(); return clone(this.data.syncs[`${userId}:${provider}`] ?? {}); }
  async setSyncState(userId, provider, state) { await this.ensureLoaded(); this.data.syncs[`${userId}:${provider}`] = clone(state); await this.persist(); }
  async getCache(userId, key) { await this.ensureLoaded(); return clone(this.data.cache[`${userId}:${key}`] ?? null); }
  async setCache(userId, key, value) { await this.ensureLoaded(); this.data.cache[`${userId}:${key}`] = clone(value); await this.persist(); }
}

function emptyData() { return { version: FILE_VERSION, connections: {}, activities: {}, syncs: {}, cache: {} }; }
function clone(value) { return value === null || value === undefined ? value : JSON.parse(JSON.stringify(value)); }
function encryptPayload(plaintext, key) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key, iv); const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]); return { version: FILE_VERSION, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: ciphertext.toString("base64") }; }
function decryptEnvelope(envelope, key) { if (envelope?.version !== FILE_VERSION) throw new Error("Unbekannte Repository-Version."); const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64")); decipher.setAuthTag(Buffer.from(envelope.tag, "base64")); const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]).toString("utf8"); const data = JSON.parse(plaintext); return data?.version === FILE_VERSION ? data : emptyData(); }

module.exports = { EncryptedFileRepository, decryptEnvelope, encryptPayload };
