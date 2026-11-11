# M0 — Repository audit

Date: 10 November 2026. Repository: `D:\desktop\Py\Reverse Snake!`. Application root: `web/`.

## Outcome and scope

The browser application is a working Prey prototype worth retaining. All 13 existing tests, ESLint, TypeScript and the production build pass. It is not yet the three-mode Phaser game described in the supplied specification. The highest-priority gameplay issue is that fresh direction presses move the player outside the fixed simulation clock.

**Recommendation, pending approval:** keep the React application and reusable pure rules; introduce Phaser incrementally after M1 contracts and the visual-direction review. See [migration options](MIGRATION_OPTIONS.md), [feature matrix](CURRENT_FEATURE_MATRIX.md), and [prioritised issues](PRIORITISED_ISSUES.md).

This is Step 2 / M0 only. The full specification is `C:\Users\anura\OneDrive\Desktop\reverse-snake-prompts.md`, as confirmed by the user. The user's later instructions replace Vercel previews with review at **http://localhost:599**, defer Git setup, and require a pause after each step and at character/theme design gates. Public sharing remains stopped. No dependency installation, gameplay fix, migration or M1 implementation was performed.

Evidence labels used throughout these documents:

- **Verified:** source inspected, command executed, or behavior observed; the specific evidence is stated.
- **Source-derived risk:** a reachable condition inferred from the implementation, not reproduced on all target browsers.
- **Proposal / hypothesis:** a recommendation or balance question requiring later approval or measurement.

## Complete application and legacy inventory

All authored application/legacy source, configuration and text documentation were inspected. Vendored dependencies and generated bundles were inventoried through metadata, relevant framework guides and licenses; this is not a manual audit of every third-party source file.

| Path relative to repository | Actual contents / status |
| --- | --- |
| `README.md`, `main.py` | Original roadmap and Kivy app with home/game/options/pause screens. |
| `screens/game_screen.py` | Original 20×20 food-as-player prototype, 10 Hz scheduled update, chase/collision and delayed reset. |
| `screens/home_screen.py`, `options_screen.py`, `pause_screen.py`, `__init__.py` | Navigation and in-memory settings; empty package initializer. |
| `core/ai.py`, `levels.py`, `player.py`, `snake.py`, `utils.py` | Five zero-byte placeholders, not reusable implementations. |
| `cpp/snake_ai.cpp`, `cpp/snake_ai.h`, `build/snake_ai.pyd` | Zero-byte placeholders; no native AI implementation. |
| `data/settings.json`, `assets/` | Empty settings file and empty asset directory. |
| `web/src/app/page.tsx`, `layout.tsx`, `globals.css` | Single arcade route, metadata/local fonts and responsive styling. |
| `web/src/lib/game.ts`, `storage.ts`, `audio.ts` | Pure rules, local save handling, synthesized effects. |
| `web/src/hooks/use-game.ts` | Simulation scheduling, UI snapshots, persistence/audio orchestration. |
| `web/src/components/reverse-snake.tsx`, `game-canvas.tsx`, `modal.tsx`, `pixel-art.tsx` | React interface/input, Canvas renderer, native dialog wrapper, SVG identity/maps. |
| `web/public/icon.svg` | Local SVG browser icon. No sprite sheets, audio recordings or remote runtime art. |
| `web/tests/game.test.ts` | 13 Node/tsx tests for rules and saves. |
| `web/package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`, `next-env.d.ts`, `AGENTS.md` | npm project, strict TypeScript, Next ESLint and Tailwind PostCSS; generated Next declarations/instructions. No custom Next config. |
| `web/README.md`, `docs/REPOSITORY_ANALYSIS.md`, `docs/VERIFICATION.md`, `docs/screenshots/*` | Earlier implementation notes and November 4 evidence. Historical checks were not treated as current test results. |
| `web/node_modules/`, `.next/`, `out/` | Installed packages, generated Next caches, stale static output from earlier sharing. Not source of truth. |

There is no Git repository or commit identifier. There is no Python requirements/lock file or Python test runner configured. Python was inspected, not launched or installed.

The original Kivy branch has source-derived defects: its left-facing head at `(15,10)` moves into its neck at `(14,10)`; its scheduled update continues after screen navigation; player collision checks cover the head rather than every body segment; tail collision checks include the departing tail; and `options_screen.py:6` imports unused `torch`. These are legacy issues, not failures of the current browser game. Preserve the legacy source for reference rather than porting those mechanisms back.

## Actual stack and scripts

| Component | Installed version | Evidence |
| --- | --- | --- |
| Node.js / npm | 24.19.0 / 11.17.0 | Executable version inspection. |
| Next.js | 16.4.5 | Manifest, installed metadata and successful build banner; App Router/Turbopack. |
| React / React DOM | 19.3.1 | Manifest and installed metadata. |
| Tailwind / Tailwind PostCSS | 4.3.4 | Installed metadata; v4 CSS import plus substantial authored CSS. |
| TypeScript / tsx | 5.9.3 / 4.23.15 | Installed metadata. |
| ESLint / eslint-config-next | 9.39.5 / 16.4.5 | Installed metadata. |
| Lucide React | 0.577.0 | Installed metadata. |
| DM Sans / Space Grotesk Fontsource Variable | 5.3.0 / 5.3.0 | Installed metadata and layout imports. |
| Phaser / Zustand | Not installed | No dependency declaration or implementation. Phaser 3.90.0 availability and MIT metadata were checked during Step 1. |

`package-lock.json` uses lockfile version 3. Its root dependency and devDependency declarations match `package.json`. `npm ls --depth=0 --json` exits 0 but reports **54 extraneous packages**, including `serve@14.2.6` and its sharing-related dependencies. A clean install was not run because M0 must not change dependencies. Installed extras do not prove an active sharing service.

The scripts that actually exist are:

| Script | Exact definition |
| --- | --- |
| `dev` | `next dev --hostname 0.0.0.0` |
| `build` | `next build` |
| `start` | `next start --hostname 0.0.0.0` |
| `lint` | `eslint .` |
| `typecheck` | `tsc --noEmit` |
| `test` | `tsx --test tests/*.test.ts` |

The review server uses the explicit loopback-only command `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 599`, not the broader default host. Port inspection found `127.0.0.1:599` listening (PID 27256 during verification); HTTP returned 200. This is a local development preview, not a public deployment or production-server smoke test.

## Simulation, state and rendering

Source evidence: `src/lib/game.ts:2–4,35–52,61–158`, `src/hooks/use-game.ts:17–72`, `src/components/game-canvas.tsx:6–8,29–102` (paths in this and following sections are relative to `web/`).

- Pure TypeScript rules use a **20 ms / 50 Hz** step. The React hook owns an RAF accumulator and clamps each frame's catch-up delta to 200 ms. Long stalls therefore discard excess wall time; survival time measures simulated time.
- Held movement advances one cell per 100 ms. Fresh keyboard/pointer presses call `steer()` directly, which moves immediately and resets `playerClock` without advancing time. Dash also mutates state directly from an input action. There is no tick-indexed input queue or replay log.
- A temporary diagnostic calling five left steers from the normal Garden spawn reached `(0,13)` with `elapsed=0`. Five fixed steps holding left reached `(4,13)` with `elapsed=100`. This verifies different movement budgets for tapping versus holding; see H-01.
- The pure functions are repeatable for an identical call sequence and state. The application does not yet provide deterministic replay of a tick-indexed input stream. Do not equate those two properties.
- `phase` is a single union: `ready`, `running`, `paused`, `won`, `lost`. It avoids conflicting playing/paused booleans. It is not a formal transition reducer or discriminated union enforcing terminal reasons. Hook guards and UI disablement currently prevent ordinary configuration changes mid-round; tests confirm non-running simulation is inert. No contradictory phase was observed during the smoke test.
- Start/restart constructs a fresh run. Quit abandons it without recording; pause/resume clears held direction. Blur/hidden events pause and clear input. RAF listeners and audio context have unmount cleanup. M1 should specify legal transitions and exactly-once terminal events explicitly.
- React receives complete game snapshots about every 80+ ms while running, plus immediate action snapshots. This is less frequent than simulation ticks, but is not the intended meaningful-event-only bridge.
- A second RAF continuously redraws the Canvas, including ready/paused/terminal screens. Logical canvas size is 600×600, with a 20 px inset and 28 px cells. DPR is capped at 2 and sampled once at mount. Movement is discrete, without render interpolation. Reduced-motion preference disables the decorative pulse and CSS transitions.

## Rules, collisions, spawning, AI and score

Source evidence: `src/lib/game.ts:21–33,61–158`; regression tests at `tests/game.test.ts:8–105`.

| Area | Current verified behavior |
| --- | --- |
| Arena/spawn | Five fixed 20×20 layouts. Snake lengths 14/16/18/20/22; hunger targets 55/60/65/70/75 seconds. Player always starts at `(5,13)`; snake follows one fixed initial path. All five spawns pass non-overlap/connectivity checks. |
| Movement | Player stops at walls/hedges; any snake segment is lethal. Dash traverses three cells, checking each intermediate cell, with a 4-second active-time cooldown. |
| Snake | Greedy Manhattan pursuit with no immediate 180° reversal. It prefers an initially unblocked direction, then commits to alternating lunge lengths: Easy 4/3, Normal 3/2, Hard 2/1. Movement intervals are 260/200/140 ms. This is conventional heuristic AI, not pathfinding or ML. |
| Collision order | In a simulation step: advance clocks, move/check player, move/check snake, check hunger win, then shorten. Moving into the snake's departing tail is legal for the snake; player collision checks the current body. |
| Outcomes | Player contact loses; snake wall/body/hedge collision wins; surviving the arena timer also wins. |
| Score | `floor(elapsedMs / 100) × difficultyMultiplier`, plus a win bonus of `round((1000 + arenaIndex × 250) × multiplier)`; multipliers 1/1.5/2. Results/storage floor the score. |
| Missing rules | No Hunter food/growth/full-board logic, additional collectibles, seed PRNG, challenge rules, multiple snakes or abilities beyond dash. These are later scope, not broken existing features. |

The edge-bait diagnostic wins Garden/Normal in **2,600 ms for 1,539 points**; a keyboard/dash browser run also produced a 1,539-point wall win. The existing wall-bait test intentionally supports this strategy. Whether such a short repeatable win is satisfying is a balance hypothesis, not evidence of a collision defect or a proven session-length target.

## Input, interface and accessibility

Source evidence: `src/components/reverse-snake.tsx:11,30–66,110–153`, `src/components/modal.tsx`, `src/app/globals.css`.

Keyboard controls include arrow keys/WASD, Space dash, Escape pause, Enter start/resume, and R restart. The newest held direction wins; releasing it falls back to another held key. Repeats do not cause additional immediate steers. Buttons, links and form fields are excluded from game shortcuts. Native dialogs pause play and support Escape/close focus handling. The game has a skip link, named buttons, focus outlines, instructions and a phase/result live region.

Source-derived risks: held keys are stored by case-sensitive `event.key`, so changing Shift between keydown and keyup can leave a stale direction; pointer release/cancel clears one shared direction even if another pointer/key still owns input. Neither edge case was reproduced on a physical mobile device. Swipe input is absent. Canvas has an application label but no nonvisual representation of current world positions; screen-reader gameplay equivalence is not established.

Desktop 1440×1000, mobile 390×844 and narrow 320×740 layouts were inspected in the in-app browser. Measured document scroll width equaled viewport width; at 320 px, both root client width and scroll width were 320 px. Menus/HUD, responsive touch controls and paused/result overlays loaded. These are desktop-engine viewport checks, not Android/iOS validation.

Measured D-pad buttons are **39×33 px**; mobile pause/fullscreen buttons are **28×28 px**; Dash is 67×67 px. The smaller controls miss a proposed 44×44 comfort target; this alone is not a claim that every control fails WCAG 2.2's 24 px minimum criterion. Arena selector strips are 3 px tall with a 5 px expansion above/below; assess their alternative controls and spacing during a formal audit.

Computed CSS colors give these normal-text contrast ratios against `#f4f4eb`: hero copy `#7b8473` **3.52:1**, difficulty caption `#748163` **3.75:1**, score note `#8a9778` **2.80:1**. These fall below 4.5:1. Many supporting labels are only 6–10 px. Increase readability during approved UI/design work; this sample is not a comprehensive accessibility certification.

## Persistence, security, assets and maintainability

`src/lib/storage.ts` uses localStorage key `reverse-snake:v1`. It bounds history to 30 runs, validates core scalar fields, tolerates malformed/blocked storage, and reports failed writes through the interface. Best-run UI shows five sorted runs. Sound and difficulty persist; arena selection and active runs do not. Attempts count completed runs, not starts. Multiple open tabs have no reconciliation protocol.

`recordRun()` calls `crypto.randomUUID()` without a fallback before persistence. An isolated Node probe with the UUID method unavailable throws `TypeError`. On a browser lacking that secure-context API, a terminal transition reached from the RAF path can throw before `setGame()` and the next RAF are scheduled (`use-game.ts:27–30,57–69`). This is a source-derived browser compatibility risk, not a failure observed at localhost, where UUID is available. See M-01.

There are no app accounts, API routes, uploaded files, database, analytics integration or remote score endpoint. Stored scores are user-editable local data, appropriate for personal play, unsuitable as authoritative online rankings. No environment/secrets files were found in the inspected source inventory. Future public hosting must serve HTTPS and design score validation separately; these are later requirements, not work authorized in M0.

Current `npm audit --json` reports **7 moderate, 0 high, 0 critical** affected package entries. The underlying advisory is [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), minimatch glob amplification, propagated through TypeScript ESLint. Every reported node is marked `dev: true` in the lockfile (minimatch 10.2.6 and six TypeScript ESLint 8.72.1 packages). No runtime dependency was identified by this report. Audit metadata says a fix is available; no upgrade/downgrade or `audit fix` was attempted. Historical November 4 advice must not be treated as the current remediation assessment.

| Asset/system | Provenance and license evidence | Disposition |
| --- | --- | --- |
| Canvas apple/snake/hedges, local SVG logo/maps/icon, CSS layout | Repository-local drawing code in `game-canvas.tsx`, `pixel-art.tsx`, `public/icon.svg`; earlier docs describe generated graphics. No third-party art source references found. No per-asset authorship/license register. | Reusable prototype visuals; original authorship and final creative approval are not independently established. Do not label final bespoke art. |
| Synthesized sound | Oscillator/envelope code in `src/lib/audio.ts`; no recorded audio files. | Retain provisionally; sound identity still needs creative review. |
| DM Sans / Space Grotesk | Actual installed `LICENSE` files: SIL OFL 1.1, project-author notices. | Keep self-hosted fonts if approved; preserve license notices when distributing. |
| Lucide icons | Installed `lucide-react/LICENSE`: ISC, with Feather-derived portions under MIT. | Retain with required notices; icon-family approval remains a later creative gate. |
| Framework/runtime dependencies | Package license metadata: Next/React/Tailwind MIT, TypeScript Apache-2.0. | Ordinary third-party code, not project-owned art. This is not a complete transitive license/legal review. |
| Legacy `assets/`, existing screenshots | Assets directory empty; screenshots are development evidence, not shipped game art. | No hidden art collection to migrate. No root project license found. |

Maintainability risks include one interface component mixing input/HUD/modal content, duplicated scheduling ownership, and no lifecycle integration suite. At this grid size, performance failure was not observed; continuous idle redraw and full-state UI snapshots are profiling candidates, not measured bottlenecks. Preserve pure rules, arena data, storage validation, accessibility scaffolding, dialogs and audio boundaries instead of replacing all of them.

## Commands and current verification

Commands ran from `D:\desktop\Py\Reverse Snake!\web` unless stated otherwise. Logs are in `C:\Users\anura\AppData\Local\Temp\reverse-snake-audit-m0-20261110`; the summaries here remain useful if temporary files are later removed.

| Executed command/check | Actual outcome | Evidence file |
| --- | --- | --- |
| `npm test` | Exit 0; 13 passed, 0 failed, 0 skipped. | `test.log` |
| `npm run lint` | Exit 0; no diagnostics. Next's inherited configuration already ignores `out/**`; the initially suspected generated-output lint failure was disproved. | `lint.log`; `node_modules/eslint-config-next/dist/index.js:218` |
| `npm run build` | Exit 0; Next 16.4.5 compiled successfully, TypeScript succeeded, 3 static pages generated; reported `/` and `/_not-found`. | `build.log` |
| `npm run typecheck` | Exit 0; no diagnostics, run after build. | `typecheck.log` |
| `npm audit --json` | Exit 1 for the 7 moderate development findings above; the report completed successfully. | `npm-audit.json` |
| `npm ls --depth=0 --json` | Exit 0; 54 extraneous package notices. | `npm-ls.json` |
| `node --import tsx --input-type=commonjs` with isolated engine/UUID/color probes | Movement discrepancy, 2.6-second wall win, missing-UUID exception and contrast ratios reproduced as described above. No permanent tests added. | `diagnostic-probes.log` |
| Read-only manifest/lockfile comparison | Root declarations match. Initial `require(package/package.json)` probe hit `ERR_PACKAGE_PATH_NOT_EXPORTED`; direct JSON file reads then succeeded. This was a probe error, not an app failure. | Recorded results in this audit. |
| PowerShell `Get-NetTCPConnection -LocalPort 599 -State Listen`; `Invoke-WebRequest http://localhost:599/` | Loopback listener and HTTP 200. | Observed tool output. |
| SHA256 baseline comparison | 42 pre-existing inventoried files checked; only generated `web/next-env.d.ts` changed during Next build. All other 41 retained their hashes. | `source-before.json`; final comparison. |

The build regenerated Next type imports in `next-env.d.ts` and refreshed generated `.next`/TypeScript cache artifacts. No authored source/config/lockfile was edited. Only four new audit Markdown documents were authored; no existing project files were deleted or renamed.

The 13 tests cover valid spawns, inert non-running phases, stationary-prey pursuit at each difficulty, committed collision outcomes, a real wall bait, departing-tail legality, player/dash obstruction and body collision, dash cooldown, hunger/shortening, restart, immediate steer and local-save validation. They do **not** cover DOM events, focus transitions, multi-pointer ownership, unavailable UUID, React/Phaser lifecycle, deterministic replay, full-board food spawning, mobile browsers or performance. Hunger tests use a fixture that postpones snake movement; they do not prove that human survival is balanced.

Browser smoke checks observed start, keyboard/dash input, pause/resume, guide open/Escape close, a 1,539-point win, a loss, restart, pointer-held movement controls, score display and persistence across reload, and responsive layouts. Console inspection returned no application warnings/errors. Test play used `http://127.0.0.1:599` as a separate storage origin; the user's `localhost` scores/settings were not cleared or overwritten. A fresh `http://localhost:599` review tab was opened, showing existing saved preferences and ready state. Temporary viewport overrides were reset.

Screenshots: `desktop.png`, `mobile.png`, `mobile-320.png`, `review.png` in the temporary evidence directory. They document the existing interface, not a redesigned Step 2 screen. Not run in this audit: a production-server browser test, physical Android/iOS/Safari/Firefox checks, a screen-reader audit, audio-quality review, fullscreen/device-rotation checks, coverage instrumentation or a sustained performance profile. No existing automated test was skipped.

## M0 exit gates and review

| Gate | Status |
| --- | --- |
| Existing systems, limitations and reusable code documented | PASS |
| Current feature matrix and prioritised issues delivered | PASS |
| Existing tests/lint/typecheck/build executed and reported | PASS |
| Evidence-backed incremental Phaser option presented | PASS |
| Local review game available at port 599 | PASS |
| No feature/dependency migration performed | PASS; generated build outputs noted above |
| Security/accessibility issues fully resolved | FAIL — identified, intentionally not repaired during audit; not an M0 completion requirement |
| User approval to adopt migration strategy and begin M1 | BLOCKED — awaiting review, as requested |

M0's audit deliverables are complete. The next action is **user review of the incremental Phaser recommendation**, then, only after explicit approval, Step 3 / M1: define rules, legal states and technical contracts. No character/theme asset is needed to finish this audit; those requests belong at the creative gate.
