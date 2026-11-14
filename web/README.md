# Reverse Snake — browser edition

A fruit-neutral browser game with flexible boards that fill the outer playing area and expand in fullscreen. Escape a learning snake in Levels or Survival, or control the snake against an evasive fruit in Hunter. Three timed local Challenges and completed-run Replays are available.

Version 1.2.0 adds two trainable local neural policies, five selectable fruit skins and four snake designs, full fruit ghosts at 32% opacity, and a translucent blurred pause with independent recorded gameplay behind it. Choose your look before every match; learning and appearance persist separately from existing scores. The live round remains frozen during pause.

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
| Space / touch Dash button | Move three cells; four-second cooldown |
| Esc | Pause |
| Enter | Start / resume when the playing field has focus |
| R | Restart the active round |
| On-screen direction buttons | Hold to move on touch devices |

Five arenas, three difficulties, and Levels / Survival are available from the start. Mode, arena and difficulty controls stay fixed during an active or paused round; end the round to change them. Leaving the tab or window pauses automatically. Personal bests, the last 30 completed runs (including mode and close-call count), and sound/difficulty preferences are saved locally. Existing saves remain readable. If storage is blocked or UUID support is unavailable, play and result screens continue to work.

A **close call** is a safe move away from a cell directly beside the snake's head. It grants **2× movement speed for 2 seconds in Levels or 5 seconds in Survival**. Each new dodge refreshes the full timer with **no cooldown**. Standing still, blocked movement, body proximity, and collisions do not grant a boost. A safe dash can trigger it. Turquoise leaf trails, a leaf burst, an aura, and a countdown show the boost; reduced-motion mode keeps the aura and countdown while suppressing trails and bursts. Pause freezes the timer. The manual three-cell dash still has its separate four-second cooldown.

All movement presses share the fixed simulation budget, so rapid tapping cannot outrun holding a direction. The latest held keyboard key or touch contact controls movement; releasing it restores the most recent remaining source. Modifier changes, pointer cancellation, blur, pause, and restart clear or restore input consistently.

The hunter chooses a direction toward you and commits for a short lunge: alternating 4/3 cells on Easy, 3/2 on Normal, and 2/1 on Hard. It cannot reverse into its neck. A dash cannot pass through the hunter, walls, or mossy stones. In Levels the snake shrinks over time; survive 55–75 seconds depending on the arena to win through hunger. In Survival the snake keeps its length and a crash brings a fresh hunter on a clear edge; the round ends when you are caught.

Both modes plan a route around stones and the current body at every new lunge, shortening the lunge at known route corners. Standing still at the starting position lets the hunter reach you, including in Wild Heart Levels. A lunge already underway stays committed, so a quick dodge can still bait a crash. Survival replacement hunters recalculate the route to your current position.

Scores: 10 points/second, multiplied by 1 / 1.5 / 2 for Easy / Normal / Hard. Levels also award a win bonus of `1000 + arenaIndex * 250` with the same multiplier. Abandoned rounds are not recorded.

## Verification

```powershell
npm test
npm run lint
npm run build
npm run typecheck
```

For browser regressions, build first, install Chromium once with `npx playwright install chromium`, then run `npm run test:browser`. The suite starts and stops a production server on loopback port 599. To use an installed Chrome on Windows instead: `$env:REVERSE_SNAKE_BROWSER = 'chrome'; npm run test:browser`.

For hosted verification, set `REVERSE_SNAKE_BASE_URL` to the actual Preview or production HTTPS URL; Playwright then skips its local server. `npm audit --audit-level=moderate` checks all dependencies. GitHub Actions runs clean installation, audit, rules, lint, build, types and browser tests on candidate branches and main.

Hunter turns with WASD/arrows or touch directions and moves automatically. It has no fruit dash. Food grows the snake and earns 100 points × difficulty; walls, stones and body collisions lose, filling the free board wins. Local Challenge uses fixed Survival rules with a 15/20/25-second goal. These modes store separate local results. Replays retain three completed runs within bounded size/step limits, validate versions and final state, and exclude abandoned runs. They capture simulation actions rather than audio or paused wall time. Old fruit saves retain their original key and semantics.

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
- `tests/game.test.ts`: regression checks for movement, collision, AI, hunger, pause and saves.
- `tests/boosts.test.ts`, `tests/input.test.ts`, `tests/compatibility.test.ts`: boost timing, ownership and compatibility regressions.
- `browser-tests/game.spec.ts`: real input, close-call chases, result handling, reloads, contrast, reduced motion and responsive checks.
- `browser-tests/theme.spec.ts`: default/persistent themes, storage fallback, tab synchronization, paused character positions, click/touch/focus, alternate mode links, contrast and all-route viewport checks.

All graphics are drawn in project-owned canvas/SVG/CSS; fonts are bundled locally. See [Step 2 add-ons](docs/STEP_2_ADDONS.md) for the approved art direction and changes, and [verification](docs/VERIFICATION.md) for current checks. The phased Phaser migration remains a separate future milestone.
