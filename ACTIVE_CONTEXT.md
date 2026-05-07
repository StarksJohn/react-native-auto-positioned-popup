# ACTIVE_CONTEXT — react-native-auto-positioned-popup

Rolling task memory for Cursor chats. Keep entries short; source of truth is still git history.

## Recent sessions

- 2026-05-07: Initialized via `ask-react-native-auto-positioned-popup` skill; added repo-local session recovery file and expanded skill workflow.
- 2026-05-07: `/ask-react-native-auto-positioned-popup` — unblocked release prep: fixed `AdvancedFlatList` `style` typing in `src/AutoPositionedPopup.tsx` (ternary instead of `&&` so numeric `0` cannot enter style array). `npm run build` + `npm run lint` succeed (lint warnings only). **Publish not run:** local npm CLI not authenticated (`npm whoami` → 401).

## Open items

- Log in to npm: `npm login` (or restore token), then publish.
- Choose version: default **patch** `1.2.20` → `1.2.21` via `npm run release:patch-auto` or interactive `npm run release` (see `NPM_PUBLISH_GUIDE.md`).
- Git: branch `main` was **ahead of origin/main by 1** before this session’s file edits; commit any intended changes (TS fix + this file) before release script pushes.

## Decisions / constraints

- Session continuity: prefer updating this file after substantive work; stable facts live in `.cursor/rules/project-context.mdc`.

## Release / integration notes

- Package version in repo before bump: **1.2.20** (`package.json`).
