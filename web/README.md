# Reverse Snake — browser edition

A playable React / Next.js / Tailwind CSS adaptation of the Python prototype in the parent directory. You control a golden mango under a dark teal jungle canopy. An amber patterned snake hunts you. Bait it into a wall, mossy stone, or its own body—or survive until it runs out of energy in Levels. Survival offers an endless chase.

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

Scores: 10 points/second, multiplied by 1 / 1.5 / 2 for Easy / Normal / Hard. Levels also award a win bonus of `1000 + arenaIndex * 250` with the same multiplier. Abandoned rounds are not recorded.

## Verification

```powershell
npm test
npm run lint
npm run build
npm run typecheck
```

For browser regressions, build first, install Chromium once with `npx playwright install chromium`, then run `npm run test:browser`. The suite starts and stops a production server on loopback port 599. To use an installed Chrome on Windows instead: `$env:REVERSE_SNAKE_BROWSER = 'chrome'; npm run test:browser`.

## Structure

- `src/lib/game.ts`: deterministic 20ms game simulation, collision rules, arenas, AI and scoring.
- `src/hooks/use-game.ts`: frame loop, pause lifecycle, actions and persistence.
- `src/components/game-canvas.tsx`: canvas rendering, independent of React's UI refresh rate.
- `src/components/reverse-snake.tsx`: responsive arcade, controls, dialogs and accessibility.
- `src/lib/storage.ts`: defensive, versioned local saves.
- `src/lib/input.ts`: normalized keys and independent keyboard/pointer ownership.
- `src/lib/render-game.ts`: jungle canvas art and motion-aware close-call effects.
- `src/lib/audio.ts`: synthesized sound effects; audio starts only after user interaction.
- `tests/game.test.ts`: regression checks for movement, collision, AI, hunger, pause and saves.
- `tests/boosts.test.ts`, `tests/input.test.ts`, `tests/compatibility.test.ts`: boost timing, ownership and compatibility regressions.
- `browser-tests/game.spec.ts`: real input, close-call chases, result handling, reloads, contrast, reduced motion and responsive checks.

All graphics are drawn in project-owned canvas/SVG/CSS; fonts are bundled locally. See [Step 2 add-ons](docs/STEP_2_ADDONS.md) for the approved art direction and changes, and [verification](docs/VERIFICATION.md) for current checks. The phased Phaser migration remains a separate future milestone.
