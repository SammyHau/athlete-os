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
- `TrainingScreen` owns temporary session state and derives daily lists, completed minutes, and weekly progress from it.
- Training cards and the detail modal are reusable presentation components.
- The local data factory can later be replaced by a repository connected to a backend, Garmin, or Strava without changing the UI contract.
