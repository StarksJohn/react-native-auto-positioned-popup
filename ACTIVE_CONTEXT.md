# ACTIVE_CONTEXT — react-native-auto-positioned-popup

Rolling task memory for Cursor chats. Keep entries short; source of truth is still git history.

## Recent sessions

- 2026-05-07: Initialized via `ask-react-native-auto-positioned-popup` skill; added repo-local session recovery file and expanded skill workflow.
- 2026-05-07: `/ask-react-native-auto-positioned-popup` — unblocked release prep: fixed `AdvancedFlatList` `style` typing in `src/AutoPositionedPopup.tsx` (ternary instead of `&&` so numeric `0` cannot enter style array). `npm run build` + `npm run lint` succeed (lint warnings only). **Publish not run:** local npm CLI not authenticated (`npm whoami` → 401).
- 2026-05-07: Skill invoked again; `npm whoami` still **401**; `git status` → `main...origin/main` (no longer ahead). `npm run build` still OK.
- 2026-05-07: **Security:** npm password was pasted into chat / `SKILL.md`; scrubbed from `~/.cursor/skills/ask-react-native-auto-positioned-popup/SKILL.md`. **Rotate npm password** (and enable 2FA) at https://www.npmjs.com/ — assume the previous secret is compromised. Never put credentials in skills, rules, or agent chat.
- 2026-05-07: **Publish attempt:** `npm whoami` → `stark2018`. Ran `npm version patch` → **1.2.21**, commit `chore: release 1.2.21`, tag **`v1.2.21`**. **`npm publish` failed E403** — npm requires **2FA OTP at publish time** (or granular access token with appropriate publish permissions). Registry does **not** yet have 1.2.21.
- 2026-05-07: Rechecked npm account: `npm profile get` shows **two-factor auth: disabled**. Passing `--otp` cannot satisfy package publish policy until account 2FA is enabled for writes, or a publish-capable token is used.
- 2026-05-07: **Released 1.2.21:** npm publish succeeded with a granular token; `npm view react-native-auto-positioned-popup version` → **1.2.21**. `git push` succeeded; `v1.2.21` exists on origin. `git push --tags` reported failure only because old tag **`v1.2.12`** already exists remotely. User pasted the npm token in terminal output; deleted local user npm token config, but token must be revoked on npm website.
- 2026-05-07: Updated `NPM_PUBLISH_GUIDE.md` with the verified Granular Access Token release workflow and a top-level “every future npm release” checklist.

## Open items

- **Security:** Revoke the exposed npm granular token on npmjs.com and create a new one only when needed. If password was ever exposed, rotate npm password and review active sessions/tokens.

## Decisions / constraints

- Session continuity: prefer updating this file after substantive work; stable facts live in `.cursor/rules/project-context.mdc`.
- Avoid `npm run release:patch-auto` for “quiet” releases if undesired: `scripts/release.js` preflight **updates all dependencies** to latest — use `npm version` + `npm publish` when you only want a version bump.

## Release / integration notes

- **Released version:** **1.2.21** is published on npm and pushed to GitHub (`main`, `v1.2.21`).
