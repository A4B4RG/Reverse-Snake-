# Reverse Snake — browser edition

A fruit-neutral browser game with flexible boards that fill the outer playing area and expand in fullscreen. Escape a learning snake in Levels or Survival, or control the snake against an evasive fruit in Hunter. Three timed local Challenges and completed-run Replays are available.

Version 1.3.0 adds ten maps, movement-based Levels score targets and saved next-map unlocks. Choose your food character and snake design once through named options in Menu; those choices carry across rounds and modes. Mobile uses directional swipes and double-tap dash, with setup in Menu to leave more room for the board. Two trainable local neural policies, full fruit ghosts at 32% opacity, and independent recorded gameplay behind a blurred pause remain available. The live round remains frozen during pause.

Light is the default theme; Menu → Theme → Dark restores the original palette. Menu opens by click, tap or keyboard and offers the alternate Fruit/Hunter mode. The game fits one viewport on the tested desktop, phone and landscape sizes. See [current state](docs/CURRENT_STATE.md), [mode contracts](docs/NEW_MODES.md), [limitations](docs/KNOWN_LIMITATIONS.md), and [release evidence](docs/RELEASE.md). The root PROJECT_STATUS.md is preserved project history. Hosted verification is still unverified under the user's explicit waiver; a main push does not establish the deployed version at https://reverse-snake-chi.vercel.app.

## Run locally

Requires Node.js 24, matching the Vercel runtime configured in `package.json` and `.nvmrc`.

```powershell
cd web
npm ci
npm run dev
```

Open http://localhost:3000. For a production server, run `npm run build`, then `npm start`. Stop a foreground server with Ctrl+C.

## Deploy to Vercel

Import the repository in the [Vercel dashboard](https://vercel.com/new) and set **Root Directory** to **`web`**. The included `vercel.json` selects Next.js, installs with `npm ci`, and builds with `npm run build`. Use Node.js **24.x**, leave Output Directory at its Next.js default, and leave Environment Variables empty.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full manual deployment steps and local checks.

## Controls

| Input | Action |
| --- | --- |
| Hold WASD / arrow keys | Move; release to stop; a quick tap buffers one movement |
| Space / double-tap after a swipe | Dash three cells in the last direction; four-second cooldown |
| Esc | Pause |
| Enter | Start / resume when the playing field has focus |
| R | Restart the active round |
| Swipe up / down / left / right on the board | Keep moving in that direction; swipe again to turn |

Ten maps, three difficulties, and Levels / Survival are available. Levels starts with Canopy Clearing; reach each map's score target to unlock the next. Survival and Hunter allow all maps. Mode, map, difficulty and character controls stay fixed during an active or paused round; end the round to change them. Leaving the tab or window pauses automatically. Personal bests, unlocks, the last 30 completed runs (including mode and close-call count), and sound/difficulty preferences are saved locally. Existing saves remain readable. If storage is blocked or UUID support is unavailable, play and result screens continue to work.

A **close call** is a safe move away from a cell directly beside the snake's head. It grants **2× movement speed for 2 seconds in Levels or 5 seconds in Survival**. Each new dodge refreshes the full timer with **no cooldown**. Standing still, blocked movement, body proximity, and collisions do not grant a boost. A safe dash can trigger it. Turquoise leaf trails, a leaf burst, an aura, and a countdown show the boost; reduced-motion mode keeps the aura and countdown while suppressing trails and bursts. Pause freezes the timer. The manual three-cell dash still has its separate four-second cooldown.

All movement presses share the fixed simulation budget, so rapid tapping cannot outrun holding a direction. A swipe remains active until replaced by another swipe or cleared by pause/restart. Directional taps do not steer. A double-tap after a swipe triggers the existing dash; there is no on-screen arrow pad or Dash button. Keyboard presses temporarily take precedence, restoring the prior active input on release.

The hunter chooses a direction toward you and commits for a short lunge: alternating 4/3 cells on Easy, 3/2 on Normal, and 2/1 on Hard. It cannot reverse into its neck. A dash cannot pass through the hunter, walls, or mossy stones. In Levels the snake shrinks as your score grows; reaching the map's target clears the level. Crashes bring a fresh hunter until the target is met. In Survival the snake keeps its length; the round ends when you are caught.

Both modes plan a route around stones and the current body at every new lunge, shortening the lunge at known route corners. Standing still at the starting position lets the hunter reach you, including in Wild Heart Levels. A lunge already underway stays committed, so a quick dodge can still bait a crash. Survival replacement hunters recalculate the route to your current position.

Levels earns 1 / 1.5 / 2 points per moved cell on Easy / Normal / Hard. Idle and blocked movement earns none; capture takes precedence over a target. Targets rise from 150 to 1300 points across ten maps, listed in [current state](docs/CURRENT_STATE.md). Survival earns 10 points/second with the same multipliers. Abandoned rounds are not recorded. Earlier scores retain their recorded values; old replays use their original rules.

## Verification

```powershell
npm test
npm run lint
npm run build
npm run typecheck
```

For browser regressions, build first, install Chromium once with `npx playwright install chromium`, then run `npm run test:browser`. The suite starts and stops a production server on loopback port 599. To use an installed Chrome on Windows instead: `$env:REVERSE_SNAKE_BROWSER = 'chrome'; npm run test:browser`.

For hosted verification, set `REVERSE_SNAKE_BASE_URL` to the actual Preview or production HTTPS URL; Playwright then skips its local server. `npm audit --audit-level=moderate` checks all dependencies. GitHub Actions runs clean installation, audit, rules, lint, build, types and browser tests on candidate branches and main.

Hunter turns with WASD/arrows or swipes and moves automatically. It has no fruit dash. Food grows the snake and earns 100 points × difficulty; walls, stones and body collisions lose, filling the free board wins. Local Challenge uses fixed Survival rules with a 15/20/25-second goal. These modes store separate local results. Replays retain three completed runs within bounded size/step limits, validate versions and final state, and exclude abandoned runs. They capture simulation actions rather than audio or paused wall time. Old fruit saves retain their original key and semantics.

Online PvP can keep the current Vercel frontend address; a custom domain is optional. It needs a realtime authoritative match service, room/lobby handling, input validation and synchronization. Accounts, rankings and durable results additionally need identity and database storage. See [the PvP architecture proposal](docs/ONLINE_PVP.md); those services are not part of the current local game.

## Structure

- `src/lib/game.ts`: deterministic 20ms game simulation, collision rules, arenas, AI and scoring.
- `src/hooks/use-game.ts`: frame loop, pause lifecycle, actions and persistence.
- `src/components/game-canvas.tsx`: canvas rendering, independent of React's UI refresh rate.
- `src/components/reverse-snake.tsx`: responsive arcade, controls, dialogs and accessibility.
- `src/lib/storage.ts`: defensive, versioned local saves.
- `src/lib/input.ts`: normalized keys and independent keyboard/pointer ownership.
- `src/lib/render-game.ts`: jungle canvas art and motion-aware close-call effects.
- `src/lib/theme.ts`, `src/components/game-menu.tsx`: persistent light/dark palettes and the shared click/tap menu.
- `src/lib/audio.ts`: synthesized sound effects; audio starts only after user interaction.
- `tests/game.test.ts`: regression checks for movement, collision, AI, movement targets, pause and saves.
- `tests/boosts.test.ts`, `tests/input.test.ts`, `tests/compatibility.test.ts`: boost timing, ownership and compatibility regressions.
- `browser-tests/game.spec.ts`: real input, close-call chases, result handling, reloads, contrast, reduced motion and responsive checks.
- `tests/progression.test.ts`, `browser-tests/swipe-progress.spec.ts`: score gates/unlocks, fullscreen wall density, swipe directions and double-tap dash.
- `browser-tests/theme.spec.ts`: default/persistent themes, storage fallback, tab synchronization, paused character positions, click/touch/focus, alternate mode links, contrast and all-route viewport checks.

All graphics are drawn in project-owned canvas/SVG/CSS; fonts are bundled locally. See [Step 2 add-ons](docs/STEP_2_ADDONS.md) for the approved art direction and changes, and [verification](docs/VERIFICATION.md) for current checks. The phased Phaser migration remains a separate future milestone.
