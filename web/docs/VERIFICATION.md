# Verification

## Candidate 1.1.0 — current verification

Final local run on 14 November 2026 with Node 24.19.0 and installed Chrome:

- npm ci: PASS from the committed lockfile.
- npm test: PASS, 44 rules/compatibility tests. Hunter includes spawning, buffered turns/reversals, growth, scoring, body/tail/stone collision and full-board win. Challenge tests cover repeatable starts, exact target and capture precedence. All-mode replay snapshots match repeatedly and reject incompatible/malformed input; storage corruption/quota preserves old mango data.
- npm run lint, npm audit --audit-level=moderate, npm run build and npm run typecheck: PASS. Full audit reports zero vulnerabilities. All four game/replay routes build successfully.
- REVERSE_SNAKE_BROWSER=chrome, CI=1, npm run test:browser -- --max-failures 1: PASS, **34 tests**, with **one explicit skip** because this headless browser does not hide background tabs. The separate blur-event test passes; genuine headed/device visibility switching remains NOT VERIFIED.
- The full browser run includes startup before first RAF, all three Wild Heart Levels difficulties, Survival root-wall chase, mixed real touch/key ownership, boosts/reduced motion, local results, new-mode controls/results/phone layouts, verified replay, visible independent ghost, modal focus, native fullscreen, repeated navigation, offline loaded play, no critical page errors/assets in the lifecycle scenario, and twelve single-viewport cases.
- Production Canvas sampling executed at 1440 × 900 and 320 × 568; see PERFORMANCE.md and raw performance-results.json.

During this run, hidden desktop arena shortcuts, first-frame startup reset, missing dialog focus return and short-landscape sidebar overflow were reproduced and corrected. Existing historical regressions were retained. Hosted Preview/production checks remain blocked by the origin approval denial; see RELEASE.md.

Clean installation and the scoped TypeScript ESLint/minimatch override yielded **zero full npm audit findings**. Production build and ESLint passed on the new routes. Final complete checks and actual hosted URLs/SHAs are recorded in [RELEASE.md](RELEASE.md) when executed. The reports below remain dated historical evidence; they do not describe the current deployed state automatically.

## Levels pursuit fix — Wild Heart idle start

Verified on 14 November 2026 after a report that Wild Heart Levels awards a win without any movement input.

- Reproduced on all difficulties with the default mango position `(5, 13)`: Easy crashed into an obstacle after 3.38 seconds, Normal after 2.00 seconds, and Hard after 2.38 seconds. The earlier route fix applied only to Survival.
- Both modes now use the same obstacle/body distances and stop newly planned lunges at route corners. Already committed lunges still continue, so a real dodge can bait a crash. Levels hunger, shrinking, scoring, and crash victories remain in place.
- **33 rules/compatibility tests passed.** The idle-start regression covers all 30 arena/difficulty/mode combinations and requires capture without a crash or respawn. The previous stationary boundary-win fixture now performs an actual mid-lunge dash and verifies the resulting wall-bait win. Corner and changed-target coverage runs in both modes.
- **13 production-browser tests passed**, including three new Wild Heart Levels checks that click Start, give no movement or dash input, and verify capture on Easy, Normal, and Hard. Existing Survival pursuit, boosts, input, persistence, and layout checks passed.
- **Production build, ESLint, and TypeScript checks passed.** In the corrected local simulation, idle Wild Heart capture occurs after 4.42 seconds on Easy, 3.40 seconds on Normal, and 2.38 seconds on Hard.

This Levels fix is currently an uncommitted local change; it has not been deployed by this verification. Earlier live-site checks verified the committed Survival fix. The sections below describe previous builds.

## Survival pursuit fix — Wild Heart root wall

Verified on 11 November 2026 after the player reported a repeating crash/respawn route with the mango at `(19, 11)` in Wild Heart, Hard Survival.

- Reproduced the original bug from the screenshot's head/body positions: the old straight-line turn choice produced seven resets in 30 seconds without reaching the stationary fruit. The original tests checked clear respawn geometry, but did not check pursuit after respawning.
- Survival now rebuilds shortest-path distances around obstacles and the current body at each new lunge, respecting the departing tail. A new lunge stops at a known route corner; a lunge already underway stays committed, so a player's dodge can still bait a crash. Each respawn clears the previous hunter's lunge counter.
- **33 rules tests passed**, including both lunge parities of the screenshot state, a replacement hunter pursuing targets beyond the wall, changed-target routing, corner anticipation, and a successful mid-lunge wall bait followed by renewed pursuit.
- **Ten production-browser tests passed**, including a real keyboard route to the screenshot's fruit cell, then confirming the hunter reaches that cell rather than entering the reset loop. Lint, production build and TypeScript checks passed.
- An additional diagnostic sampled 120 arena/difficulty/target combinations after respawn; all stationary targets were reached within 38 snake moves. This sample is not an exhaustive test of every possible moving-body arrangement.

The Levels pursuit rules and the approved graphics/boost settings are unchanged. The older verification below records previous builds.

## Step 2 add-ons — jungle and close-call boosts

Verified on 11 November 2026 with Node.js 24.19.0, npm 11.17.0 and installed desktop Chrome through Playwright.

- **Clean lockfile installation passed:** `npm ci`, followed by the full rules, lint, build, TypeScript and browser checks.

- **29 rules/compatibility tests passed:** the original collision, arena, chase, dash, hunger and storage coverage plus fixed movement budgets, buffered taps, idle timing, 2s/5s close-call durations, refresh without cooldown, exact sustained 2× speed, expiry, pause/restart, rejected false close calls, safe dash boosts, endless survival, clear respawns, input ownership, absent/throwing UUID, legacy saves and throwing audio.
- **Nine production-browser regressions passed:** rapid taps; Shift/W release; pause/resume ownership; two actual touch contacts interleaved with a held key; a real close-call chase in each mode; optional API failures and restart; survival save/reload; reduced motion; supporting-text contrast and 44px-or-larger frequent controls.
- **Production build, ESLint and TypeScript passed.** Playwright starts/stops a loopback production server at port 599. Browser tests control time and inspect the rendered mango's pixels rather than exposing or mutating simulation state.
- **Visual review:** desktop and mobile jungle artwork and a live close-call effect were inspected. Widths 1440, 900, 640, 390 and 320 were checked without horizontal overflow. The sampled hero, difficulty, HUD and score-note text/background pairs exceed 4.5:1. This is targeted issue verification, not a full WCAG audit.
- **Graphics feedback received:** the user selected dark teal Deep canopy with an amber patterned snake, golden mango and turquoise leaf effects before implementation. See [Step 2 add-ons](STEP_2_ADDONS.md) for the rules and issue-resolution mapping.
- **Dependency audit:** production dependencies have zero vulnerabilities. Seven moderate development-only lint findings remain. A compatible `npm audit fix` did not resolve them; the latest TypeScript ESLint package still requires minimatch 10, while the reported fix requires 11.0.1+. No forced major override or downgrade was applied.
- **Limits:** desktop Chrome and emulated multi-touch/viewports were tested; physical phones, Safari and Firefox remain untested. Phaser migration remains a separate milestone.

Current screenshots: [desktop](screenshots/jungle-desktop.png), [mobile](screenshots/jungle-mobile.png), [Levels boost](screenshots/jungle-levels-boost.png), [Survival boost](screenshots/jungle-survival-boost.png). Earlier verification below describes the historical builds.

## Vercel deployment preparation

Verified on November 11, 2026, using Node.js 24.19.0 and npm 11.17.0.

- **Clean dependency installation passed:** `npm ci` installed the committed lockfile without changing dependency versions.
- **All 13 existing game tests passed.** ESLint, the Next.js production build, and the separate TypeScript check also passed.
- **Deployment configuration checked:** all fields used in `vercel.json` match their definitions in Vercel's official JSON schema. `package.json` and `package-lock.json` both select Node.js `24.x`.
- **Production HTTP smoke check passed:** the built game returned HTTP 200, as did all nine linked script/style/icon assets and all five bundled fonts. An unknown route returned HTTP 404. The temporary loopback-only production server was stopped after verification.
- **Production dependency audit passed:** `npm audit --omit=dev` reported zero vulnerabilities.
- **Manual deployment instructions:** [DEPLOYMENT.md](../DEPLOYMENT.md). Import the repository in Vercel, select Root Directory `web`, use Next.js and Node.js `24.x`, and keep the default output directory. No environment variables are required.

These checks cover deployment preparation for the current browser game. No Vercel deployment or new interactive browser playthrough was performed during this preparation.

## Earlier browser verification

Verified on November 4, 2026.

- **13 automated tests passed**: all five arena spawns; paused/ready/end-state immobility; stationary-food pursuit on all difficulties; real wall-bait victory; wall, obstacle and body collisions; departing-tail legality; dash collision and recharge; hunger and survival victory; restart; immediate keyboard/touch movement; save round trips and malformed/unavailable storage.
- **TypeScript, ESLint, and the Next.js production build passed.**
- **Production server:** `http://localhost:3000` returned HTTP 200. The server was started as a hidden background Node process; its PID is stored in `web/.server.pid` and output in `web/server.log` and `web/server-error.log`.
- **Browser playthrough:** keyboard input, dash, pause/resume, a loss and retry, touch movement, an actual wall-bait win (1,539 points), next-arena selection, instructions, saved run history, reload persistence, and clearing the three test runs were verified.
- **Responsive checks:** normal in-app browser width, 1440×1000 desktop, and 390×844 mobile. No mobile horizontal overflow. Touch controls and layout verified; the temporary viewport override was reset after testing.
- **Browser console:** no application warnings or errors during final verification.
- **Dependency audit:** no production dependency vulnerabilities reported by `npm audit --omit=dev`. The full audit reports a moderate `minimatch` advisory propagated through development-only lint dependencies; fixing it with the registry's suggested downgrade would break the current Next.js lint setup, so it was not forced.

Screenshots are saved in `docs/screenshots/`. Test scores were cleared, and the browser was left on the ready screen for The Garden with Normal difficulty.
