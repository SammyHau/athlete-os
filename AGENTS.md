# AthleteOS Repository Guide

## Expo SDK

Expo has changed. Read the exact versioned documentation at
https://docs.expo.dev/versions/v54.0.0/ before writing code.

## Project Structure

- `App.js`: application root and global providers
- `src/navigation/`: React Navigation setup
- `src/screens/`: tab-level screens and screen state
- `src/components/`: reusable presentational components
- `src/data/`: local demo data and data-model helpers
- `src/hooks/`: screen-facing state and domain operations
- `src/services/`: persistence and external data adapters
- `src/theme/`: colors, spacing, radius, and typography tokens
- `docs/`: product, design, and roadmap documentation

## Commands

- `npm.cmd start`: start the Expo development server on Windows
- `npm.cmd run android`: start Expo for Android
- `npx.cmd --yes expo-doctor`: validate Expo configuration and dependencies
- `npx.cmd expo export --platform android --output-dir .expo-test-build --clear`: create a test production bundle
- `git diff --check`: validate patch whitespace

Use the `.cmd` shims in PowerShell when script execution policy blocks `npm.ps1` or `npx.ps1`.

## Code Conventions

- Use JavaScript and functional React components; do not add TypeScript.
- Keep screen state immutable and derive summaries from source state.
- Access training persistence through `useTrainingPlan`; UI components must not call AsyncStorage directly.
- Put reusable UI in `src/components/` and data preparation in `src/data/`.
- Use named exports for screens, components, and data helpers.
- Keep imports grouped: external packages, local modules, then theme/data as appropriate.
- Store files as UTF-8 and do not introduce replacement characters or mojibake.
- Add accessibility labels and roles to interactive controls.

## Design Rules

- All user-facing copy is German.
- Reuse the tokens exported by `src/theme/`; avoid arbitrary colors and spacing.
- Keep the interface calm, precise, minimal, and high contrast.
- Use Ionicons for interface icons and never use emoji as app icons.
- Prefer subtle borders and clear hierarchy over shadows, gradients, or decoration.
- Ensure controls have stable dimensions and usable touch targets on small phones.

## Validation

- Check imports, exports, paths, unused imports, and dynamic date behavior.
- Run available lint and test scripts when present.
- Run `git diff --check`, `expo-doctor`, and an Android Metro production export.
- Scan source and documentation for mojibake and Unicode replacement characters.
- Review the full diff for regressions, duplication, and inconsistent styles.
- Remove only self-created temporary output after validating its resolved path.

## Git Safety

Do not overwrite unrelated working-tree changes. Never create a commit or push without the user's explicit approval.
