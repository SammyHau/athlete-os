const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");

const root = path.resolve(__dirname, "..");
const sourceRoot = path.join(root, "src") + path.sep;
const originalExtension = require.extensions[".js"];
require.extensions[".js"] = (module, filename) => {
  if (!filename.startsWith(sourceRoot)) return originalExtension(module, filename);
  const result = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, plugins: ["@babel/plugin-transform-modules-commonjs"] });
  module._compile(result.code, filename);
};

const { EncryptedFileRepository } = require("../backend/src/encryptedFileRepository.cjs");
const { parseTokenEncryptionKey } = require("../backend/src/encryptionKey.cjs");
const { InMemoryActivityRepository } = require("../backend/src/activityRepository.cjs");
const { StravaDetailService } = require("../backend/src/detailService.cjs");
const { StravaSyncService, isRateLimitNear } = require("../backend/src/syncService.cjs");
const { publicConnection } = require("../backend/src/tokenService.cjs");
const { normalizeStravaActivity, normalizeStravaActivityDetail } = require("../backend/src/stravaMapping.cjs");
const { createEmptyPerformanceProfile, setPerformanceMetric } = require("../src/data/performanceProfile");
const { normalizeWorkoutSteps, moveWorkoutStep, duplicateWorkoutStep } = require("../src/data/trainingPlan");
const { deriveTrainingZones, getPrescriptionAvailability } = require("../src/utils/trainingZones");
const { findBestActivityMatch, linkActivity } = require("../src/utils/activityMatching");
const { comparePlannedToActual } = require("../src/utils/workoutComparison");
const { filterActivitiesForIntegrationMode } = require("../src/services/activityRepository");

let count = 0;
function check(actual, expected, message) { assert.deepEqual(actual, expected, message); count += 1; }

function raw(id, sportType = "Run", changes = {}) { return { id, athlete: { id: 7 }, name: `${sportType} Einheit`, sport_type: sportType, start_date: "2026-07-17T05:00:00Z", start_date_local: "2026-07-17T07:00:00", elapsed_time: 3600, moving_time: 3500, distance: 10000, total_elevation_gain: 80, ...changes }; }

async function run() {
  const mixedActivities = [{ provider: "local", id: "demo" }, { provider: "strava", id: "real" }];
  check(filterActivitiesForIntegrationMode(mixedActivities, "strava").map((item) => item.id), ["real"], "Strava-Modus schließt Demo-Aktivitäten vollständig aus");
  check(filterActivitiesForIntegrationMode(mixedActivities, "demo").map((item) => item.id), ["demo"], "Demo-Modus schließt echte Strava-Aktivitäten aus");
  const testDir = path.join(root, ".activity-intelligence-test");
  if (!testDir.startsWith(root + path.sep)) throw new Error("Ungültiges Testverzeichnis.");
  fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir);
  const repositoryFile = path.join(testDir, "repository.enc.json");
  const fixtureEncryptionKey = Buffer.alloc(32, 7).toString("base64");
  check(parseTokenEncryptionKey("").valid, false, "Fehlender Verschlüsselungsschlüssel wird abgelehnt");
  check(parseTokenEncryptionKey("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef").valid, false, "Hex wird nicht als Base64-Schlüssel akzeptiert");
  check(parseTokenEncryptionKey("kein-base64").valid, false, "Ungültiges Base64 wird abgelehnt");
  check(parseTokenEncryptionKey(Buffer.alloc(16).toString("base64")).valid, false, "Zu kurzer Base64-Schlüssel wird abgelehnt");
  check(parseTokenEncryptionKey(fixtureEncryptionKey).valid, true, "Base64 mit exakt 32 Byte wird akzeptiert");
  const repository = new EncryptedFileRepository(repositoryFile, fixtureEncryptionKey);
  await repository.set("user", { accessToken: "fixture-access", refreshToken: "fixture-refresh", expiresAt: 9999999999, scopes: ["read", "activity:read"] });
  check((await repository.get("user")).scopes.includes("activity:read"), true, "Verschlüsselte Verbindung übersteht Repository-Neuinstanzierung");
  const restarted = new EncryptedFileRepository(repositoryFile, fixtureEncryptionKey);
  check((await restarted.get("user")).expiresAt, 9999999999, "Backend-Neustart liest verschlüsselte Verbindung");
  await restarted.setSyncState("user", "strava", { backfillNextPage: 4, importedCount: 300 });
  const restartedAgain = new EncryptedFileRepository(repositoryFile, fixtureEncryptionKey);
  check((await restartedAgain.getSyncState("user", "strava")).backfillNextPage, 4, "Backfill-Cursor übersteht Backend-Neustart");
  check(fs.readFileSync(repositoryFile, "utf8").includes("fixture-access"), false, "Token steht nicht im Klartext in der Datei");
  fs.writeFileSync(repositoryFile, "beschädigt", "utf8");
  const corrupted = new EncryptedFileRepository(repositoryFile, fixtureEncryptionKey);
  check(await corrupted.get("user"), null, "Beschädigte Tokenablage fällt kontrolliert auf leeren Zustand zurück");

  const pages = [[raw(1), raw(2)], [raw(3)], []];
  const syncRepository = new InMemoryActivityRepository();
  const client = { listActivities: async (_token, request) => ({ data: pages[request.page - 1] || [], rateLimit: { limit: "100,1000", usage: "5,50" } }) };
  const service = new StravaSyncService({ client, tokenService: { getValidToken: async () => ({ accessToken: "fixture" }) }, repository: syncRepository, config: { syncPageSize: 2, syncPageLimit: 5, backfillPagesPerRun: 1 } });
  const first = await service.sync("user", new Date("2026-07-18T00:00:00Z"), { backfill: true });
  check(first.backfill.status, "running", "Historischer Backfill pausiert nach Seitenbudget");
  check(first.backfill.nextPage, 2, "Backfill-Cursor wird fortgeschrieben");
  const resumed = await service.sync("user", new Date("2026-07-18T00:00:00Z"), { backfill: true });
  check(resumed.backfill.status, "complete", "Unterbrochener Backfill wird fortgesetzt und abgeschlossen");
  check((await syncRepository.list("user", "strava")).length, 3, "Mehrseitiger Backfill importiert ohne Dubletten");
  check(isRateLimitNear({ limit: "100,1000", usage: "91,100" }), true, "Nahes Rate-Limit löst kontrollierte Pause aus");
  check(isRateLimitNear({ limit: "100,1000", usage: "20,200" }), false, "Unkritisches Rate-Limit pausiert nicht");
  const emptyService = new StravaSyncService({ client: { listActivities: async () => ({ data: [], rateLimit: null }) }, tokenService: { getValidToken: async () => ({ accessToken: "fixture" }) }, repository: new InMemoryActivityRepository(), config: { syncPageSize: 100, syncPageLimit: 2, backfillPagesPerRun: 2 } });
  check((await emptyService.sync("empty", new Date(), { backfill: true })).backfill.status, "complete", "Leere Strava-Historie schließt Backfill sauber ab");
  check(publicConnection({ expiresAt: 1, scopes: ["read", "activity:read"] }).hasPrivateActivityScope, false, "Standard-Scope stellt private Historie nicht als vollständig dar");
  check(publicConnection({ expiresAt: 1, scopes: ["read", "activity:read_all"] }).hasPrivateActivityScope, true, "Expliziter Scope-Upgrade wird transparent erkannt");

  let detailCalls = 0;
  const detailService = new StravaDetailService({ client: { getActivity: async () => { detailCalls += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return { data: raw(9) }; }, getActivityZones: async () => ({ data: [] }), getActivityStreams: async () => ({ data: {} }) }, tokenService: { getValidToken: async () => ({ accessToken: "fixture" }) }, repository: new InMemoryActivityRepository() });
  const [detailA, detailB] = await Promise.all([detailService.getDetail("user", "9"), detailService.getDetail("user", "9")]);
  check(detailCalls, 1, "Parallele identische Detailanfragen werden dedupliziert");
  check(detailA.id, detailB.id, "Deduplizierte Detailanfragen liefern dasselbe Ergebnis");
  check((await detailService.getDetail("user", "9")).cached, true, "Detaildaten werden aus Backend-Cache gelesen");
  check((await detailService.getStreams("user", "9", ["watts"])).streams, {}, "Fehlende Streams bleiben ein ehrlicher leerer Datensatz");

  const run = normalizeStravaActivity(raw(20, "Run", { has_heartrate: false, average_watts: null }));
  check(run.hasHeartRate, false, "Aktivität ohne Herzfrequenz erfindet keine Werte");
  check(run.hasPower, false, "Aktivität ohne Leistung erfindet keine Werte");
  check(normalizeStravaActivity(raw(21, "Ride")).sport, "bike", "Radaktivität wird normalisiert");
  check(normalizeStravaActivity(raw(22, "Swim")).sport, "swim", "Schwimmaktivität wird normalisiert");
  check(normalizeStravaActivity(raw(23, "WeightTraining")).sport, "strength", "Kraftaktivität wird normalisiert");
  const detailed = normalizeStravaActivityDetail(raw(24, "Run", { laps: [{ name: "Runde", distance: 1000, elapsed_time: 300 }] }), [], "2026-07-18T00:00:00Z");
  check(detailed.laps.length, 1, "Runden werden erst in Detaildaten normalisiert");

  let profile = createEmptyPerformanceProfile();
  check(getPrescriptionAvailability(profile).power, false, "Fehlende FTP erzeugt keine Wattvorgaben");
  check(deriveTrainingZones(profile).runPace, null, "Fehlende Schwellenpace erzeugt keine Pace-Zonen");
  profile = setPerformanceMetric(profile, "bike", "ftpWatts", 250);
  profile = setPerformanceMetric(profile, "run", "thresholdPaceSecondsPerKm", 270);
  profile = setPerformanceMetric(profile, "swim", "cssSecondsPer100m", 100);
  check(deriveTrainingZones(profile).bikePower.length, 5, "Bestätigte FTP erzeugt Rad-Leistungszonen");
  check(deriveTrainingZones(profile).runPace.length, 5, "Bestätigte Schwellenpace erzeugt Lauf-Pace-Zonen");
  check(deriveTrainingZones(profile).swimPace.length, 5, "Bestätigte CSS erzeugt Schwimm-Pace-Zonen");

  const steps = normalizeWorkoutSteps([{ name: "Intervall", phase: "work", durationType: "time", durationValue: 12, targetType: "power", targetMin: 215, targetMax: 230, unit: "W", repetitions: 3 }]);
  check(steps[0].repetitions, 3, "Strukturiertes Radintervall wird normalisiert");
  check(duplicateWorkoutStep(steps, 0).length, 2, "Workout-Schritt kann dupliziert werden");
  check(moveWorkoutStep(duplicateWorkoutStep(steps, 0), 0, 1)[1].name, "Intervall", "Workout-Schritte können verschoben werden");
  check(normalizeWorkoutSteps([{ name: "Schwimmserie", targetType: "swimPace", durationType: "distance" }])[0].targetType, "swimPace", "Strukturiertes Schwimmtraining wird unterstützt");

  const session = { id: "plan", date: "2026-07-17", sport: "run", title: "Run Einheit", durationMinutes: 60, workoutSteps: [{ targetType: "heartRate", targetMin: 140, targetMax: 155 }] };
  const match = findBestActivityMatch(run, [session]);
  check(["automatic", "probable"].includes(match.status), true, "Plan und Aktivität werden transparent bewertet");
  check(linkActivity([run], run.id, session.id)[0].matchStatus, "manual", "Manuelle Zuordnung wird als Beziehung gespeichert");
  check(linkActivity([{ ...run, plannedSessionId: session.id }], run.id, null)[0].plannedSessionId, null, "Zuordnung kann aufgehoben werden");
  const comparison = comparePlannedToActual(session, run);
  check(comparison.dataQuality, "eingeschränkt", "Soll-Ist ohne Streams weist begrenzte Datenqualität aus");
  const withStreams = comparePlannedToActual(session, run, { streams: { heartrate: { data: [145, 150, 160] } } });
  check(withStreams.targetRange, 67, "Soll-Ist berechnet Zeitanteil im Zielbereich aus vorhandenen Streams");

  fs.rmSync(testDir, { recursive: true, force: true });
  console.log(`${count} Activity-Intelligence-Prüfungen erfolgreich.`);
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => { require.extensions[".js"] = originalExtension; });
