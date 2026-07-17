# Project Vision

## Purpose
A personal athlete operating system for Samuel.

## Core Goals
- Combine strength, calisthenics and triathlon training
- Use Strava and later Garmin data
- Provide daily training recommendations
- Track recovery, progress and nutrition
- Keep the interface clean, calm and premium

## User
Samuel Haußmann

## Product Principles
- Personal first
- Minimal and precise
- Data driven
- Fast and simple
- No unnecessary features
- Training recommendations instead of raw data only

## Training Architecture

- `src/data/trainingPlan.js` creates a local demo plan for the current calendar week.
- Training sessions use stable IDs, ISO dates, normalized sport and status values, structured blocks, and source metadata.
- `TrainingProvider` instantiates `useTrainingPlan` once above navigation. Home, Training, Plan, and Progress consume the same live state through `useTraining`.
- `useTrainingPlan` owns immutable CRUD operations, loading, reload, and serialized persistence writes.
- `src/utils/trainingAnalytics.js` provides pure selectors for days, weeks, periods, distributions, trends, consistency, and navigation requests.
- Training cards and the detail modal are reusable presentation components.
- `TrainingFormModal` handles validated creation, editing, moving, and draft duplication, including structured blocks.
- `trainingStorage.js` persists a versioned `{ version, sessions }` envelope under `athleteos.trainingPlan.v1` using AsyncStorage.
- Missing storage uses dynamic demo data without an initial write. Invalid storage falls back safely and logs the error.
- Calendar navigation supports previous, next, and current weeks while keeping Monday as the first day.
- Home derives today's work and the next planned session from persisted sessions. Plan renders four rolling weeks, and Progress calculates 7-, 28-, and 90-day analytics from the same source.
- The storage service can later be replaced by a repository connected to a backend, Garmin, or Strava without changing the UI contract.

## Local Training Limits

- Training changes remain local to one device and have no account sync or conflict resolution.
- Storage migration currently recognizes version 1; future versions need an explicit migration branch.
- Dates are entered as local ISO calendar dates without a separate time or timezone field.

## Recovery Architecture

- `RecoveryProvider` owns validated daily check-ins and editable Recovery settings independently from training persistence.
- `recoveryStorage.js` persists a versioned `{ version, checkIns, settings }` envelope under `athleteos.recovery.v1`.
- `recoveryAnalytics.js` calculates transparent Readiness factors and estimated load from completed training sessions without copying training state.
- Home exposes the daily check-in and Recovery details; Progress shows honest seven-day Recovery history; Profile owns sleep-goal and personal-baseline settings.
- Missing check-ins never produce synthetic Readiness values. Optional resting-heart-rate and HRV values require seven earlier personal values before affecting a score.

## Local Recovery Limits

- Readiness supports training decisions but is not a medical diagnosis.
- Estimated load uses duration, sport, and intensity because RPE and power data are not available yet.
- Recovery data remains local and has no account sync.

## Integration Architecture

- `IntegrationProvider` selects a contract-compatible `local` demo or `strava` provider and exposes connection, sync, status, results, and offline activities.
- Normalized actual activities are persisted separately under `athleteos.activities.v1`; planned sessions remain unchanged and can be linked through `plannedSessionId`.
- The Node backend owns OAuth state, authorization-code exchange, rotating tokens, deauthorization, athlete access, pagination, rate-limit metadata, sync, and explicit stream retrieval.
- Strava secrets and tokens never enter the Expo bundle or mobile AsyncStorage.
- The first sync covers at most 90 days. Incremental sync overlaps one day to capture changes, while provider and external ID prevent duplicates.
- Missing activities are retained for offline visibility. Production webhooks will mark deleted or unavailable Strava activities explicitly.

## Local Integration Limits

- The demo provider uses only artificial activities tagged as `local`.
- The local backend listens on loopback and uses an in-memory token/activity store plus a development user header.
- Production requires HTTPS, authenticated sessions, encrypted token persistence, a database repository, fixed redirect allowlists, and Strava webhooks.

## Activity Intelligence Architecture

- An AES-GCM encrypted file repository persists local OAuth, activity, cache, and resumable backfill state when a manual encryption key is configured.
- Summary backfill, incremental sync, lazy detail loading, explicit stream loading, dual mobile/backend caches, and request deduplication minimize Strava rate-limit usage.
- `PerformanceProfile`, central training zones, structured workout steps, confidence-based matching, and data-quality-aware comparisons form the prescription domain.
- Training presents a searchable actual-activity history and lazy detail modal; Profile owns confirmed performance values and separate imported-data deletion.
- See `docs/tasks/ACTIVITY_INTELLIGENCE_V1.md` and `docs/tasks/WORKOUT_PRESCRIPTION_V1.md` for contracts and operational limits.
