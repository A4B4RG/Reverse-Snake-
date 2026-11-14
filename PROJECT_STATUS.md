# Reverse Snake — Current Project Scenario

**As of 14 November 2026**

## Current scenario — browser release 1.5.0

The current browser edition has 30 connected maps, score-gated Food and Hunter Levels with saved stars, both Survival modes, local Challenges and deterministic Replays. Food hunters grow, split into two, stun in place after collision and resume from their tails; Hunter keeps one controlled snake with random speed/Stun powers and relocating Hard walls. The welcome/role/instruction flow, default Easy and light theme, named character options, directional swipes, double-tap dash, touch sensitivity, frame settings and original jungle music are implemented. The playing board fills the available rectangle and expands in fullscreen.

The repository is [A4B4RG/Reverse-Snake-](https://github.com/A4B4RG/Reverse-Snake-) and delivery uses `main` / `origin/main` with the existing GitHub Actions and Vercel integration. Current source, checks and delivery evidence are described in [CURRENT_STATE.md](web/docs/CURRENT_STATE.md), [VERIFICATION.md](web/docs/VERIFICATION.md) and [RELEASE.md](web/docs/RELEASE.md). Hosted Vercel gameplay remains unverified under the existing user waiver. The Python/Kivy prototype is preserved; online PvP, an editor and native Android packaging remain separate scope. These statements describe progress and do not define completion.

## Preserved earlier scenario
This snapshot is preserved as project history. For the subsequent implementation and release state, see [the current browser report](web/docs/CURRENT_STATE.md). This file describes progress; the separate complete-build specification defines the requested work.

Reverse Snake is a playable browser game with a deployed website, a GitHub repository, automated regression coverage, and a preserved Python/Kivy prototype. The browser edition in `web/` is the current implementation. Its core game loop, jungle presentation, Levels and Survival modes, local scores, and input handling are implemented. The broader Phaser migration and online platform remain future scope.

This document describes the present product and repository state. Older audit and migration documents contain historical findings and proposals that need to be read alongside the implemented fixes described here.

## Current playable game

The player controls a golden mango on a 20 × 20 grid while an AI-controlled snake pursues it. Movement, dodging, and baiting the snake into a crash form the main gameplay.

| Area | Implemented behavior |
| --- | --- |
| Levels | Win when the snake hits a boundary, obstacle, or its own body, or survive until its hunger timer expires. The snake gradually shrinks during the round. |
| Survival | An endless chase with a constant-length snake. A crashed snake is replaced at a clear edge; play continues until the mango is caught. |
| Difficulty | Easy, Normal, and Hard change the snake's movement interval, lunge commitment, and score multiplier. |
| Collision | Boundaries and obstacles block the mango. Contact with any snake segment loses the round, including during a dash. The snake may enter its departing tail cell. |
| Dash | A three-cell movement burst with a separate four-second cooldown. It respects collisions. |
| Close calls | Safely moving away from a cell directly beside the snake's head grants 2× movement speed: two seconds in Levels or five seconds in Survival. Another qualifying dodge refreshes the duration without a boost cooldown. |
| Round control | Start, pause, resume, restart, retry, and Levels progression are available. Switching away from the window or tab pauses the game automatically. |
| Setup | Both modes, all five arenas, and all three difficulties are available from the start. Setup choices stay fixed during an active or paused round. |

The five implemented arenas have different obstacle layouts and starting snake lengths:

| Arena | Starting snake length | Levels survival target |
| --- | --- | --- |
| Canopy Clearing | 14 cells | 55 seconds |
| Root Divide | 16 cells | 60 seconds |
| Mango Grove | 18 cells | 65 seconds |
| Temple Hollow | 20 cells | 70 seconds |
| Wild Heart | 22 cells | 75 seconds |

Scores accrue at 10 points per second before difficulty multipliers: 1× on Easy, 1.5× on Normal, and 2× on Hard. Levels wins also award a bonus based on arena and difficulty. Abandoned rounds are not recorded.

## Controls, presentation, and saved data

Keyboard controls support held WASD or arrow keys, Space to dash, Escape to pause, Enter to start or resume when the playing field has focus, and R to restart. On-screen direction buttons and a Dash button support touch input. Quick taps are buffered, and rapid tapping shares the same movement budget as held input. Keyboard and pointer contacts retain separate ownership, with the most recently pressed remaining input controlling movement.

The implemented visual direction is **Deep canopy**: dark teal jungle scenery, an amber snake with diamond markings, a golden mango, mossy obstacles, and turquoise leaf effects. The page includes setup controls, a score/time HUD, personal best, instructions, results, run history, sound controls, and fullscreen support. Graphics are authored in Canvas, SVG, and CSS; fonts are bundled with the application.

Close calls have a visible countdown, fruit aura, leaf trail, burst, and status feedback. Reduced-motion settings suppress moving trails and bursts while retaining the aura and countdown. Responsive layouts and larger touch targets are implemented.

Browser `localStorage` holds personal best, attempt/win counts, the last 30 completed runs, sound preference, and difficulty preference. Runs include mode and close-call count, and older saves remain readable. Missing UUID support, blocked storage, and audio failures are handled so they do not prevent gameplay or result handling.

Scores are local to a browser and site address. There is no account, cloud synchronization, shared leaderboard, or saved active round.

## Snake pursuit and the reported wall bugs

The reported Wild Heart bug involved the snake repeatedly crashing near the root wall, respawning, and following a route that failed to reach the mango beyond the obstacle.

An additional Levels bug awarded a Wild Heart win after roughly two to three seconds even when the mango never moved. The earlier route fix was limited to Survival. The local implementation now shares obstacle-aware pursuit across both modes, so the hunter reaches the idle starting mango instead of crashing into a root wall.

The current local AI rebuilds walking distances to the mango's current position at each new lunge, routing around obstacles and the current snake body while allowing the departing tail cell. Newly planned lunges shorten at known route corners. A lunge already underway remains committed, preserving the player's ability to dodge and bait a crash.

Respawning clears the previous snake's commitment and lunge counter. The replacement snake plans toward the current mango position. Regression coverage includes the reported arrangement, both lunge parities, pursuit after respawn, a moved target, route corners, and a mid-lunge wall bait.

The Survival fix is present in the latest Git commit and in the deployed game; its exact Wild Heart chase passed local and live browser verification. The additional Levels fix passes local production-browser verification and is currently uncommitted and awaiting deployment. Levels still retains its hunger timer, shrinking snake, scoring, and crash victories.

## Technical architecture

The browser edition uses **TypeScript, Next.js 16.4.5, React 19.3.1, and Tailwind CSS 4**. Node.js 24.x is selected for local development and deployment. The application package is version `1.0.0`.

| Repository area | Current responsibility |
| --- | --- |
| `web/src/lib/game.ts` | Pure game rules, state, arenas, collisions, AI, scoring, dash, boosts, and deterministic 20 ms simulation steps. |
| `web/src/hooks/use-game.ts` | Animation-frame accumulator, active simulation, pause lifecycle, player actions, UI updates, and persistence coordination. |
| `web/src/components/game-canvas.tsx` | Canvas lifecycle and drawing loop, reading the current simulation state. |
| `web/src/lib/render-game.ts` | Jungle artwork, characters, obstacles, and visual effects. |
| `web/src/components/reverse-snake.tsx` | Main interface, setup, HUD, input integration, dialogs, and results. |
| `web/src/lib/input.ts` | Key normalization and keyboard/pointer ownership. |
| `web/src/lib/storage.ts` | Save validation, backward compatibility, local run IDs, and completed-run records. |
| `web/src/lib/audio.ts` | Synthesized browser sound effects and guarded audio lifecycle. |
| `web/src/app/` | Next.js route, layout, metadata, and global styling. |
| `web/tests/` | Rules, boosts, input, compatibility, storage, and Survival pursuit tests. |
| `web/browser-tests/` | Playwright tests of real controls, rendered gameplay, results, persistence, and responsive behavior. |
| `web/docs/` | Implementation explanations, verification evidence, screenshots, historical audits, and migration proposals. |

Gameplay runs in the browser. The deployed game does not require a Python runtime, C++ extension, database, API key, or separate game backend. Phaser is not installed or integrated; the world currently uses the Canvas renderer and the React hook's simulation scheduler.

## Preserved Python/Kivy prototype

The original desktop prototype remains in `main.py` and `screens/`. It contains a Kivy screen manager, home/options/pause screens, a 20 × 20 board, WASD movement, simple axis-based pursuit, snake wall/self-collision checks, capture detection, and automatic reset after an outcome.

It is less complete than the browser edition. Its outcome presentation is unfinished, Continue does not restore a persisted session, and its sound option is a UI toggle rather than the browser sound system. Source inspection also identified a starting-direction self-collision, an update scheduler that continues across screen changes, and an unused Torch import. These legacy issues have not been repaired or runtime-verified in the recent browser work.

The files under `core/` and `cpp/` are empty placeholders. `build/snake_ai.pyd` is also an empty file, so a functioning native AI extension has not been built. A reproducible Python dependency manifest and desktop test setup are not committed. The browser implementation should be used to assess current feature completeness; the original README's older prototype sections describe an earlier scope.

## Git repository and deployment

| Item | Current state |
| --- | --- |
| GitHub repository | [A4B4RG/Reverse-Snake-](https://github.com/A4B4RG/Reverse-Snake-) |
| Remote | `origin` → `https://github.com/A4B4RG/Reverse-Snake-.git` |
| Local branch | `main`, tracking `origin/main` |
| Latest committed gameplay change | `1a4c040d7057f4c9546c5f67f9596098f6437d31` — **Fix Survival hunter routing after wall crashes** |
| Latest commit date | 11 November 2026 |
| Remote synchronization | GitHub's `main` and local committed `main` point to the same commit. The additional Levels fix remains a local working-tree change. |
| Live application | [reverse-snake-chi.vercel.app](https://reverse-snake-chi.vercel.app) |
| Hosting | Vercel, serving the Next.js application from `web/`. |
| Deployment configuration | `web/vercel.json` selects Next.js, `npm ci`, and `npm run build`; Node.js 24.x is declared in the package. No application environment variables are required. |

The repository contains both implementations, the browser dependency lockfile, deployment configuration, tests, documentation, and screenshots. Git is configured and the committed gameplay changes are pushed. Statements in older migration notes that Git setup was deferred or public sharing was stopped describe an earlier situation.

Current uncommitted work includes the Levels pursuit fix, expanded regression coverage, documentation updates, and this new `PROJECT_STATUS.md` overview. These local changes have not been pushed or deployed.

Browser dependencies, generated builds, logs, local environment files, and test output are excluded through `web/.gitignore`. Python bytecode caches are still tracked, alongside the empty native-build placeholder. No project-wide license file or GitHub Actions workflow is committed.

## Verification and current confidence

The current local build passes **all 33 rules/compatibility tests**, including idle-start pursuit across all 30 arena/difficulty/mode combinations and a real wall-bait dodge. **All 13 production-browser tests**, the production build, ESLint, and TypeScript checks passed on 14 November. Browser coverage includes Wild Heart Levels on every difficulty, the Survival root-wall chase, real keyboard routes, mixed inputs, close calls in both modes, pause/restart, optional API failures, saved results after reload, reduced motion, and responsive layouts.

Earlier live checks verified the committed Survival fix, and the live site returned HTTP 200 with the expected game page on 14 November. The new Levels fix still requires a commit and deployment before it is available there.

Responsive checks cover widths from 320 to 1440 pixels. Desktop Chrome and emulated touch/viewports have been tested. Physical phones, Safari, Firefox, and a complete accessibility audit remain outside the verified coverage. The pursuit tests address the reported loop; they are not an exhaustive proof of every moving-body configuration.

The last recorded dependency audit reported zero production vulnerabilities and seven moderate development-only lint dependency findings. That audit has not been refreshed for this document.

## Remaining scope and maintenance gaps

- **Phaser migration:** an incremental migration strategy is documented, but the runtime, scenes, event bridge, and gameplay port have not been implemented. It remains a separate project milestone.
- **Additional game/platform features:** a player-controlled Hunter mode, Challenge mode, replay/seed systems, online leaderboards, accounts, cloud saves, a level editor, and an Android package are not implemented. These appear in earlier proposals or future plans rather than the current product.
- **Gameplay balance:** the current modes and difficulties work, but session balance and long-term replay value have not been validated through broader player testing.
- **Compatibility:** physical-device testing, additional browser coverage, and broader accessibility verification remain necessary to establish support beyond the tested environments.
- **Maintenance:** development dependency advisories, repository licensing, tracked Python caches, legacy setup, and stale documentation need separate attention. Older audit items should be checked against current source before being treated as open bugs.

## Working with the current browser edition

From the repository root, with Node.js 24 installed:

```powershell
cd web
npm ci
npm run dev
```

The development game is served at `http://localhost:3000`. A production build uses `npm run build` followed by `npm start`. Available checks are `npm test`, `npm run lint`, `npm run typecheck`, and `npm run test:browser`; browser tests expect a production build and an available Playwright browser or installed Chrome.

For supporting detail, consult `web/README.md`, `web/DEPLOYMENT.md`, `web/docs/STEP_2_ADDONS.md`, and `web/docs/VERIFICATION.md`. The documents in `web/docs/audit/` retain the earlier assessment and proposed future architecture.
