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
- Recovery and training-load values on Home remain explicitly marked local demo values.
