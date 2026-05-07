# ACTIVE_CONTEXT — react-native-auto-positioned-popup

Rolling task memory for Cursor chats. Keep entries short; source of truth is still git history.

## Recent sessions

- 2026-05-07: Initialized via `ask-react-native-auto-positioned-popup` skill; added repo-local session recovery file and expanded skill workflow.
- 2026-05-07: `/ask-react-native-auto-positioned-popup` — unblocked release prep: fixed `AdvancedFlatList` `style` typing in `src/AutoPositionedPopup.tsx` (ternary instead of `&&` so numeric `0` cannot enter style array). `npm run build` + `npm run lint` succeed (lint warnings only). **Publish not run:** local npm CLI not authenticated (`npm whoami` → 401).
- 2026-05-07: Skill invoked again; `npm whoami` still **401**; `git status` → `main...origin/main` (no longer ahead). `npm run build` still OK.
- 2026-05-07: **Security:** npm password was pasted into chat / `SKILL.md`; scrubbed from `~/.cursor/skills/ask-react-native-auto-positioned-popup/SKILL.md`. **Rotate npm password** (and enable 2FA) at https://www.npmjs.com/ — assume the previous secret is compromised. Never put credentials in skills, rules, or agent chat.

## Open items

- **Urgent:** Change npm account password (and review active tokens / sessions) after accidental disclosure.
- Log in locally yourself: run **`npm login`** in your own terminal (interactive; do not pipe passwords). Then **`npm whoami`**, then **`npm run release:patch-auto`** or **`npm run release`** (see `ACTIVE_CONTEXT` / `NPM_PUBLISH_GUIDE.md`).
- Optional: keep “publish to npm” notes only in `ACTIVE_CONTEXT.md`, not in skill body.

## Decisions / constraints

- Session continuity: prefer updating this file after substantive work; stable facts live in `.cursor/rules/project-context.mdc`.

## Release / integration notes

- Package version in repo before bump: **1.2.20** (`package.json`).
