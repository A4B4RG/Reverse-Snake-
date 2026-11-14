# Current browser product

Updated 14 November 2026 for version 1.3.0, ruleset `orchard-4`. This describes the current product and repository scenario. Root `PROJECT_STATUS.md` remains a historical progress snapshot; it does not define completion.

Reverse Snake is a browser game in `web/`, built with Next.js 16.4.5, React 19.3.1, TypeScript, Node 24 and Canvas. Escape Levels and Survival use ten maps and Easy, Normal and Hard. Hunter lets the player control the snake against an evasive fruit. Three timed local Challenges and completed-run Replays use separate routes. Light is the default theme; the original dark palette remains selectable in the click/tap/keyboard Menu. Fruit offers Hunter and Hunter offers Fruit, omitting their own mode link.

## Maps and progression

Levels begins with Canopy Clearing. Successful fruit movement earns 1 / 1.5 / 2 points per cell on Easy / Normal / Hard, including safe dash movement. Idle and blocked movement earns none. Reaching the current map's score target clears it and unlocks the next map; capture takes precedence. The snake shrinks as score progresses. A snake crash brings a replacement hunter that plans toward the current fruit, rather than clearing the level. Survival retains time scoring at 10 points/second times difficulty and constant-length replacement hunters. Survival and Hunter offer all maps without Levels unlocks.

| Level | Map | Score target | Layout |
| --- | --- | --- | --- |
| 1 | Canopy Clearing | 150 | Scattered root corners and open exits |
| 2 | Root Divide | 250 | Dividing walls with staggered branches |
| 3 | Orchard Grove | 350 | Four solid stone islands |
| 4 | Temple Hollow | 450 | Broken temple walls and inner corners |
| 5 | Wild Heart | 550 | Tangled roots and blind corners |
| 6 | Bamboo Lanes | 650 | Alternating vertical lanes |
| 7 | River Switchbacks | 800 | Staggered horizontal banks |
| 8 | Ruined Courtyard | 950 | Nested courtyard walls and offset gates |
| 9 | Thorn Labyrinth | 1100 | Interlocking walls and narrow turns |
| 10 | Crown Maze | 1300 | Nested broken walls and baffles |

Unlocks persist in the existing `reverse-snake:v1` save. Older stored Levels wins migrate to progress. Clearing score history preserves unlocks; clearing site data removes them. Setup rejects locked maps during Levels, and active/paused rounds freeze configuration. Old scores keep their historical values, so old and current Levels records are not directly comparable.

The board fills the outer playing rectangle with independent rows and columns, a target cell size of 18–30 CSS pixels and bounds of 12–96 cells per axis. Fullscreen increases the playable cell count. Walls now scale by their full occupied footprint, retaining density instead of becoming sparse strips. Connected floor, legal spawn and resize checks cover all ten maps. Resize remaps actors into legal connected positions while retaining phase, elapsed time, score, boosts and learning; it is recorded for replay. Twenty-cell coordinates are authored terrain templates and legacy replay geometry, not a fixed live board.

## Controls and presentation

Menu contains one pair of named dropdowns: **Food character** and **Snake design**. Choose Apple, Mango, Pear, Orange or Strawberry and Amber, Jade, Coral or Midnight once; choices persist across rounds, routes and reloads until changed. Apple/Jade are fresh defaults. Choices freeze during active/paused play and are captured in recordings. Full fruit artwork and distinctive snake patterns retain cell-based hitboxes.

On touch devices, swipe up, down, left or right on the board to continue moving in that direction. Another swipe changes direction. Taps do not steer. Double-tap after a swipe dashes three cells in the last direction with the existing four-second cooldown. There is no on-screen arrow pad or Dash button. Hunter uses swipes for turns and has no fruit dash. Desktop retains held WASD/arrows, Space dash, Esc pause, Enter start/resume and R restart. Pause/restart clears continuing swipe movement.

Compact phone/landscape layouts hide the hero and setup sidebar, putting mode, pace, map/course and saved character choices in Menu. The board occupies most of the viewport. Desktop keeps setup beside the game and a compact keyboard guide directly below the frame. Score-target progress and the map name sit above the board. Light/dark styling, reduced motion, sound, results and fullscreen remain available.

## Learning and replay

Both opponents use local neural behavior imitation: two networks with 14 inputs, 12 tanh hidden units and four softmax outputs train by backpropagation on successful human moves. Fruit movement teaches the fruit policy; human snake movement teaches the snake policy. Hunting combines fruit-turn prediction and learned snake preferences with legal routing. Evasion combines learned fruit choices and predicted snake movement. Difficulty changes anticipation and imitation strength as well as cadence/commitment. Learning persists separately in `reverse-snake:learning:v1`; failed storage retains it during the current visit. Imitation does not guarantee every habit improves an opponent.

A matching fruit-controlled ghost draws recorded full artwork once at 32% opacity without affecting collisions, scoring or training. Board geometry is part of matching; resize clears incompatible ghosts. A blurred translucent pause loops a separate recorded cursor while the live round and normal ghost remain frozen. First-visit pause can use the current prefix; reduced motion keeps the preview static. Unscored previews do not create completed score or replay entries.

New format-2 recordings use version 1.3.0 / `orchard-4`, capturing geometry, appearance, initial models, ordered actions and resize events. Deterministic training and playback verify the final fingerprint. Retained engines preserve 1.2.0 / `orchard-3` and 1.1.0 / `canopy-2` playback with their original terrain and rules. Three completed recordings remain bounded to 250 KB each and 180,000 steps. Scores omit model weights. Unknown/malformed versions and oversized recordings are rejected safely.

## Repository, verification and remaining scope

GitHub: [A4B4RG/Reverse-Snake-](https://github.com/A4B4RG/Reverse-Snake-), local branch `main`, tracking `origin/main`. The pre-update checkpoint is `0a6c35e9118613e6fca67a14e5b86d76ac646ada`. Source, tests, current reports and screenshots are delivered through the existing main integration; [RELEASE.md](RELEASE.md) records delivery evidence. The Python/Kivy prototype, native placeholders and historical `PROJECT_STATUS.md` are preserved.

Local verification covers 59 rules tests and all 55 runnable browser cases, with one existing headless visibility skip. Build, lint, TypeScript and the full zero-findings audit pass. [VERIFICATION.md](VERIFICATION.md) distinguishes the full run and corrected fullscreen assertion rerun. Coverage includes gesture directions/dash/pause, real movement through a target and saved unlock, all map selectors, fullscreen walls, models, old/current replays, saved artwork, themes, original Wild Heart routing and twelve main-game viewports. [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) links current screenshots.

Online PvP needs a realtime authoritative match service; the current Vercel address can remain the frontend and a custom domain is optional. [ONLINE_PVP.md](ONLINE_PVP.md) explains rooms, synchronization, storage and a practical first release. No online service has been added. Phaser, an editor and native Android packaging remain separate work; see [technical decisions](TECHNICAL_DECISIONS.md).

Updated Vercel Preview/production gameplay remains **NOT VERIFIED** under the user's explicit hosted-check waiver. A main push is not proof of the deployed version at https://reverse-snake-chi.vercel.app. Physical devices, Safari/Firefox, external player balance and a full nonvisual accessibility audit remain unverified; see [known limitations](KNOWN_LIMITATIONS.md).
