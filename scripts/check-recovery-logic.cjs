const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const babel = require("@babel/core");

const root = path.resolve(__dirname, "..");
const sourceRoot = path.join(root, "src") + path.sep;
const originalExtension = require.extensions[".js"];
const originalLoad = Module._load;
const memory = new Map();

require.extensions[".js"] = (module, filename) => {
  if (!filename.startsWith(sourceRoot)) return originalExtension(module, filename);
  const result = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  });
  module._compile(result.code, filename);
};

Module._load = (request, parent, isMain) => request === "@react-native-async-storage/async-storage"
  ? { __esModule: true, default: {
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => memory.set(key, value),
    removeItem: async (key) => memory.delete(key),
  } }
  : originalLoad(request, parent, isMain);

const recovery = require("../src/data/recovery");
const analytics = require("../src/utils/recoveryAnalytics");
const storage = require("../src/services/recoveryStorage");

let count = 0;
function check(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  count += 1;
}

function draft(date, changes = {}) {
  return { ...recovery.createRecoveryDraft(date), ...changes };
}

async function run() {
  check(recovery.validateRecoveryDraft(draft("2026-07-17")), {}, "Gültiger Entwurf wird akzeptiert");
  check(Boolean(recovery.validateRecoveryDraft(draft("2026-02-31")).date), true, "Ungültiges Datum wird abgelehnt");
  check(Boolean(recovery.validateRecoveryDraft(draft("2026-07-17", { sleepQuality: 6 })).sleepQuality), true, "Ungültige Bewertung wird abgelehnt");
  check(Boolean(recovery.validateRecoveryDraft(draft("2026-07-17", { restingHeartRate: 10 })).restingHeartRate), true, "Ungültiger Ruhepuls wird abgelehnt");
  check(Boolean(recovery.validateRecoveryDraft(draft("2026-07-17", { hrv: "" })).hrv), false, "Fehlende HRV ist erlaubt");

  const first = recovery.upsertRecoveryCheckIn([], draft("2026-07-17"), new Date("2026-07-17T08:00:00Z"));
  check(first.length, 1, "Check-in wird erstellt");
  const edited = recovery.upsertRecoveryCheckIn(first, draft("2026-07-17", { energy: 5 }), new Date("2026-07-17T09:00:00Z"));
  check(edited.length, 1, "Pro Tag bleibt ein Check-in aktiv");
  check(edited[0].id, first[0].id, "Bearbeitung behält stabile ID");
  check(edited[0].createdAt, first[0].createdAt, "Bearbeitung behält Erstellzeit");
  check(edited[0].energy, 5, "Bearbeitung aktualisiert Werte");
  check(first[0].energy, 3, "Quelldaten bleiben unverändert");
  check(recovery.removeRecoveryCheckIn(edited, edited[0].id).length, 0, "Check-in wird gelöscht");
  check(recovery.normalizeRecoverySettings({ ...recovery.defaultRecoverySettings, sleepGoalMinutes: 200 }), null, "Ungültiges Schlafziel wird abgelehnt");

  const ideal = recovery.upsertRecoveryCheckIn([], draft("2026-07-17", {
    sleepDurationMinutes: 480, sleepQuality: 5, soreness: 1, stress: 1, energy: 5, motivation: 5,
  }))[0];
  check(analytics.calculateReadiness(ideal, [ideal], [], { ...recovery.defaultRecoverySettings, sleepGoalMinutes: 480 }).score, 100, "Ideale Eingaben erreichen 100");

  const heavySessions = Array.from({ length: 4 }, (_, index) => ({
    id: `heavy-${index}`, date: `2026-07-${14 + index}`, sport: "run", title: "Hart", durationMinutes: 300,
    intensity: "Hoch", status: "completed", source: "Test", description: "", blocks: [], notes: "",
  }));
  const low = recovery.upsertRecoveryCheckIn([], draft("2026-07-17", {
    sleepDurationMinutes: 0, sleepQuality: 1, soreness: 5, stress: 5, energy: 1, motivation: 1,
  }))[0];
  check(analytics.calculateReadiness(low, [low], heavySessions, recovery.defaultRecoverySettings).score <= 10, true, "Sehr niedrige Eingaben bleiben nahe null");

  check(analytics.estimateSessionLoad({ ...heavySessions[0], status: "planned" }), 0, "Geplante Einheit erzeugt keine Belastung");
  check(analytics.getEstimatedLoad([], new Date(2026, 6, 17)).last7, 0, "Keine abgeschlossenen Einheiten ergeben null Belastung");
  const mixed = [
    { ...heavySessions[0], date: "2026-07-17", sport: "swim", durationMinutes: 60, intensity: "Locker" },
    { ...heavySessions[1], date: "2026-07-17", sport: "bike", durationMinutes: 90, intensity: "Moderat" },
    { ...heavySessions[2], date: "2026-07-17", sport: "strength", durationMinutes: 45, intensity: "Hoch" },
  ];
  check(analytics.getEstimatedLoad(mixed, new Date(2026, 6, 17)).last7 > 0, true, "Mehrere Sportarten werden belastungswirksam");
  check(Number.isFinite(analytics.getEstimatedLoad(mixed, new Date(2026, 6, 17)).ratio), true, "Belastungsverhältnis bleibt endlich");

  let history = [];
  for (let index = 1; index <= 8; index += 1) {
    history = recovery.upsertRecoveryCheckIn(history, draft(`2026-07-${String(index).padStart(2, "0")}`, { restingHeartRate: 50 + index, hrv: 60 + index }));
  }
  const baselines = analytics.getPersonalBaselines(history, "2026-07-09");
  check(Boolean(baselines.restingHeartRate), true, "Ruhepuls-Basiswert entsteht nach sieben Werten");
  check(Boolean(baselines.hrv), true, "HRV-Basiswert entsteht nach sieben Werten");
  check(analytics.getPersonalBaselines(history.slice(0, 6), "2026-07-09").hrv, null, "Zu kurze Historie erzeugt keinen Basiswert");
  const sevenDays = analytics.getRecoveryHistory(history, [], recovery.defaultRecoverySettings, 7, new Date(2026, 6, 10));
  check(sevenDays.length, 7, "Historie enthält sieben Kalendertage");
  check(sevenDays.filter((item) => !item.checkIn).length, 2, "Fehlende Tage bleiben fehlend");
  check(analytics.summarizeRecovery(sevenDays).count, 5, "Nur vorhandene Check-ins werden aggregiert");
  check(analytics.getRecoveryHistory(history, [], recovery.defaultRecoverySettings, 7, new Date(2026, 6, 8)).every((item) => item.checkIn), true, "Sieben aufeinanderfolgende Check-ins bleiben vollständig");

  await storage.saveRecoveryData(edited, recovery.defaultRecoverySettings);
  check((await storage.loadRecoveryData()).status, "loaded", "Recovery-Daten überstehen simulierten Neustart");
  memory.set(storage.RECOVERY_STORAGE_KEY, "{kaputt");
  check((await storage.loadRecoveryData()).status, "invalid", "Beschädigtes JSON wird abgefangen");
  await storage.resetRecoveryData();
  check((await storage.loadRecoveryData()).status, "empty", "Recovery-Daten werden zurückgesetzt");

  console.log(`${count} Recovery- und Belastungsprüfungen erfolgreich.`);
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  require.extensions[".js"] = originalExtension;
  Module._load = originalLoad;
});
