# Reverse Snake — browser edition

A playable React / Next.js / Tailwind CSS adaptation of the Python prototype in the parent directory. You control the apple. The snake hunts you. Bait it into a wall, hedge, or its own body—or survive until it runs out of energy.

## Run locally

Requires Node.js 20.9 or newer (Node 24 recommended).

```powershell
cd web
npm install
npm run dev
```

Open http://localhost:3000. For a production server, run `npm run build`, then `npm start`. Stop a foreground server with Ctrl+C.

## Controls

| Input | Action |
| --- | --- |
| Hold WASD / arrow keys | Move; release to stop |
| Space / touch Dash button | Move three cells; four-second cooldown |
| Esc | Pause |
| Enter | Start / resume when the playing field has focus |
| R | Restart the active round |
| On-screen direction buttons | Hold to move on touch devices |

Five arenas and three difficulties are available from the start. Arena and difficulty controls stay fixed during an active or paused round; end the round to change them. Leaving the tab or window pauses automatically. Personal bests, the last 30 completed runs, and sound/difficulty preferences are saved locally. No server, account, or external services are required during play. If storage is blocked, play continues with scores kept for the current visit.

The hunter chooses a direction toward you and commits for a short lunge: alternating 4/3 cells on Easy, 3/2 on Normal, and 2/1 on Hard. It cannot reverse into its neck. A dash cannot pass through the hunter, walls, or hedges. The snake shrinks over time; survive 55–75 seconds depending on the arena to win through hunger.

Scores: 10 points/second plus a win bonus of `1000 + arenaIndex * 250`, multiplied by 1 / 1.5 / 2 for Easy / Normal / Hard. Abandoned rounds are not recorded.

## Verification

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

## Structure

- `src/lib/game.ts`: deterministic 20ms game simulation, collision rules, arenas, AI and scoring.
- `src/hooks/use-game.ts`: frame loop, pause lifecycle, actions and persistence.
- `src/components/game-canvas.tsx`: canvas rendering, independent of React's UI refresh rate.
- `src/components/reverse-snake.tsx`: responsive arcade, controls, dialogs and accessibility.
- `src/lib/storage.ts`: defensive, versioned local saves.
- `src/lib/audio.ts`: synthesized sound effects; audio starts only after user interaction.
- `tests/game.test.ts`: regression checks for movement, collision, AI, hunger, pause and saves.

All graphics are generated with canvas/SVG/CSS. Fonts are bundled locally. See `docs/REPOSITORY_ANALYSIS.md` for the original repository analysis and porting decisions.
