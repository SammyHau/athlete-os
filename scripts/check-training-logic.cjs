const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const babel = require("@babel/core");

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src") + path.sep;
const originalLoader = require.extensions[".js"];
const originalModuleLoad = Module._load;
const memory = new Map();

require.extensions[".js"] = (module, filename) => {
  if (!filename.startsWith(sourceRoot)) {
    return originalLoader(module, filename);
  }
  const source = fs.readFileSync(filename, "utf8");
  const result = babel.transformSync(source, {
    filename,
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  });
  module._compile(result.code, filename);
};

Module._load = (request, parent, isMain) => {
  if (request === "@react-native-async-storage/async-storage") {
    return {
      __esModule: true,
      default: {
        getItem: async (key) => memory.get(key) ?? null,
        setItem: async (key, value) => memory.set(key, value),
        removeItem: async (key) => memory.delete(key),
      },
    };
  }
  return originalModuleLoad(request, parent, isMain);
};

const plan = require("../src/data/trainingPlan");
const analytics = require("../src/utils/trainingAnalytics");
const storage = require("../src/services/trainingStorage");

let assertions = 0;
function check(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

async function run() {
  const reference = new Date(2026, 6, 15, 12);
  const sessions = plan.createDemoTrainingPlan(reference);
  const monday = plan.getWeekDates(reference)[0].isoDate;

  check(sessions.length, 10, "Demo-Woche enthält zehn Einheiten");
  check(plan.isISODate("2026-07-15"), true, "ISO-Datum wird erkannt");
  check(plan.isISODate("2026-02-31"), false, "Ungültiges Kalenderdatum wird abgelehnt");
  check(plan.getWeekDates(reference).length, 7, "Woche enthält sieben Tage");
  check(plan.toISODate(plan.getWeekDates(reference)[0].date), "2026-07-13", "Woche startet Montag");
  check(analytics.safePercent(10, 0), 0, "Division durch null bleibt stabil");
  check(analytics.safePercent(150, 100), 100, "Prozentwert wird begrenzt");
  check(analytics.getSessionsForDate(sessions, monday).length, 2, "Tagesfilter arbeitet korrekt");
  check(analytics.getSessionsForWeek(sessions, reference).length, 10, "Wochenfilter arbeitet korrekt");

  const summary = analytics.summarizeSessions(sessions);
  check(summary.completedCount, 5, "Abgeschlossene Einheiten werden gezählt");
  check(summary.skippedCount, 0, "Ausgelassene Einheiten werden gezählt");
  check(Number.isFinite(summary.fulfillmentRate), true, "Erfüllung bleibt endlich");
  check(analytics.summarizeSessions([]).fulfillmentRate, 0, "Leere Auswahl liefert null Prozent");
  check(analytics.getSportDistribution([]).every((item) => item.percentage === 0), true, "Leere Sportverteilung bleibt stabil");
  check(analytics.getIntensityDistribution([]).every((item) => item.percentage === 0), true, "Leere Intensitätsverteilung bleibt stabil");
  check(analytics.getStatusDistribution(sessions).reduce((sum, item) => sum + item.count, 0), 10, "Statusverteilung ist vollständig");
  check(analytics.getWeeklyTrend(sessions, 6, reference).length, 6, "Trend umfasst sechs Wochen");
  check(analytics.getRollingWeeks(sessions, 4, reference).length, 4, "Plan umfasst vier Wochen");
  check(analytics.getConsistency([]).percentage, 0, "Leere Konsistenz bleibt stabil");
  check(analytics.formatMinutes(125), "2 h 5 min", "Minuten werden lesbar formatiert");

  const nav = analytics.createTrainingNavigationRequest("2026-07-15", sessions[0].id);
  check(nav.selectedDate, "2026-07-15", "Navigation übernimmt Datum");
  check(nav.sessionId, sessions[0].id, "Navigation übernimmt Session-ID");
  check(typeof nav.requestId, "string", "Navigation erhält Request-ID");

  const original = sessions;
  const toggled = plan.toggleTrainingStatus(original, sessions[0].id);
  check(toggled === original, false, "Statusänderung erzeugt neues Array");
  check(toggled[0] === original[0], false, "Statusänderung erzeugt neues Objekt");
  check(original[0].status, "completed", "Quelldaten bleiben unverändert");
  check(toggled[0].status, "planned", "Status wird umgeschaltet");

  const draft = plan.createEmptyTrainingSession("2026-07-20");
  draft.title = "Testlauf";
  const created = plan.insertTrainingSession([], draft, "test-session");
  check(created.length, 1, "Einheit wird angelegt");
  check(plan.insertTrainingSession(created, draft, "test-session"), null, "Doppelte ID wird verhindert");
  const updated = plan.replaceTrainingSession(created, "test-session", { ...created[0], durationMinutes: 60 });
  check(updated[0].durationMinutes, 60, "Einheit wird aktualisiert");
  check(plan.removeTrainingSession(updated, "test-session").length, 0, "Einheit wird entfernt");
  check(plan.createDuplicateDraft(created[0]).status, "planned", "Duplikat wird geplant angelegt");

  await storage.saveTrainingSessions(created);
  const loaded = await storage.loadTrainingSessions();
  check(loaded.status, "loaded", "Persistierte Daten werden geladen");
  check(loaded.sessions, created, "Persistierte Daten überstehen simulierten Neustart");
  await storage.resetTrainingSessions();
  check((await storage.loadTrainingSessions()).status, "empty", "Storage kann zurückgesetzt werden");

  console.log(`${assertions} Trainingslogik-Prüfungen erfolgreich.`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  require.extensions[".js"] = originalLoader;
  Module._load = originalModuleLoad;
});
