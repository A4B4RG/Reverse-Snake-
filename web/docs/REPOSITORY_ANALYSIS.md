# Original repository analysis and browser adaptation

## Complete source inventory

The repository was a small Python/Kivy prototype. All existing source files and its README were read before implementation.

| File / folder | Original behavior / contents |
| --- | --- |
| `main.py` | Kivy application with a fading screen manager: home, game, options, pause. |
| `screens/home_screen.py` | New Game, Continue, Options, Exit. New Game and Continue both only switched to the game screen. |
| `screens/game_screen.py` | 20×20 grid, red food player, green snake, 10Hz update loop, WASD movement, axis-priority chase, wall/body wins, head/player loss, automatic reset after two seconds. |
| `screens/options_screen.py` | In-memory sound-label toggle, console bio, borderless fullscreen. Unused `torch` import introduced an unnecessary dependency. |
| `screens/pause_screen.py` | Screen navigation for Continue, Home, and Exit. |
| `screens/__init__.py` | Empty. |
| `core/ai.py`, `levels.py`, `player.py`, `snake.py`, `utils.py` | Empty planned modules. |
| `cpp/snake_ai.cpp`, `cpp/snake_ai.h` | Empty planned native AI files. |
| `build/snake_ai.pyd` | Zero-byte placeholder, not a compiled implementation. |
| `data/settings.json` | Empty placeholder. |
| `assets/` | Empty; no existing images, audio, or design assets to port. |
| `README.md` | Design intent and roadmap. Described collision as future work, although the game screen already implemented basic checks. |

## Findings that informed the port

1. **Immediate self-collision:** the original head starts at `(15, 10)` with its neck at `(14, 10)`, and the player lies to its left. The first chase move hits its own neck and immediately wins. The browser snake faces away from its trailing body and may not reverse.
2. **Pause was visual only:** Kivy scheduled the update loop in the screen constructor and did not stop it when leaving the game. Food and snake could continue moving on the home/options/pause screens. The browser simulation is inert outside the running phase and auto-pauses when focus is lost.
3. **Missing player/body collision:** only the snake head was checked against the food after movement. The browser checks every segment, including each intermediate dash cell.
4. **Tail collision timing:** the prototype checked the entire old body before removing its tail. The browser allows the snake to move into the tail cell that leaves during the same step.
5. **No distinct result UI:** both win and loss displayed the same red overlay, then reset without showing the outcome. The browser has separate result screens, scores, retry, and arena progression.
6. **Missing persistent state:** sound only changed a label and Continue did not load anything. The browser has actual optional synthesized sound, real pause/resume, saved settings and local run history.
7. **Planned features:** shrinking, five levels, difficulty, better visuals, and a web version were roadmap items, not existing functionality. These are now implemented.

## Gameplay choices

- Preserve the 20×20 board, food-as-player concept, hunter AI, survival, and crash-to-win objective.
- Hold-to-move controls support keyboard and touch; release to stop. This is clearly explained in the interface.
- A chasing AI that always takes a safe path is hard to trick. The new AI checks its initial direction, then commits to a short lunge so food can bait it into a crash.
- Lunge lengths alternate (4/3 cells on Easy, 3/2 on Normal, 2/1 on Hard). A single fixed length creates a lattice of unreachable cells, while capping every lunge at the food's exact row/column makes wall baits impossible. Alternating lengths preserves both pursuit and the ability to overcommit.
- A three-cell dash adds a limited escape tool. It respects all intermediate collisions and costs a four-second cooldown.
- Hunger shrinks the snake and gives each arena a finite survival goal. This realizes the README's planned shrinking mechanic without replacing crash victories.
- Five distinct obstacle layouts, increasing length and survival targets. All arenas can be selected immediately.
- Three difficulty levels change snake speed, turning commitment and score multiplier; food speed stays consistent.

## Browser architecture

Next.js App Router serves a single React arcade page. Tailwind CSS v4 and authored CSS provide responsive styling. Canvas renders the game; SVG draws small identity and map graphics. Fonts are self-hosted through npm packages, and Web Audio synthesizes short effects. No Python service, native module, database, remote font request, or third-party game asset is needed.

The pure engine advances in fixed 20ms steps. A requestAnimationFrame loop uses an accumulator and caps catch-up time. Canvas reads the latest simulation state, while the React HUD refreshes about every 80ms. Pause clears directional input, and resuming starts from the exact frozen simulation. localStorage writes are bounded and guarded so storage failures do not break gameplay.

The original Python source has been preserved. All browser application code lives under `web/`.
