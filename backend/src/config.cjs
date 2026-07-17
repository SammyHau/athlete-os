const fs = require("node:fs");
const path = require("node:path");

function loadLocalEnv() {
  const file = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
  }
}

loadLocalEnv();

const config = {
  port: Number(process.env.PORT) || 8787,
  host: process.env.HOST || "0.0.0.0",
  clientId: process.env.STRAVA_CLIENT_ID || "",
  clientSecret: process.env.STRAVA_CLIENT_SECRET || "",
  redirectUri: process.env.STRAVA_REDIRECT_URI || "",
  backendBaseUrl: process.env.BACKEND_BASE_URL || "http://localhost:8787",
  mobileRedirectUri: process.env.MOBILE_REDIRECT_URI || "athleteos://integration/strava",
  stateTtlMs: 10 * 60 * 1000,
  syncPageLimit: 10,
  syncPageSize: 100,
  backfillPagesPerRun: 5,
  tokenEncryptionKey: process.env.ATHLETEOS_TOKEN_ENCRYPTION_KEY || "",
  repositoryFile: process.env.ATHLETEOS_REPOSITORY_FILE
    ? path.resolve(__dirname, "..", process.env.ATHLETEOS_REPOSITORY_FILE)
    : path.resolve(__dirname, "../data/integration.enc.json"),
  webhookVerifyToken: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || "",
};

function getMissingStravaConfig() {
  return [
    ["STRAVA_CLIENT_ID", config.clientId],
    ["STRAVA_CLIENT_SECRET", config.clientSecret],
    ["STRAVA_REDIRECT_URI", config.redirectUri],
  ].filter(([, value]) => !value || value.startsWith("replace-")).map(([key]) => key);
}

module.exports = { config, getMissingStravaConfig };
