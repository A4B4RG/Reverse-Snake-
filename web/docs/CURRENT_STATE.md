# Current browser product

Updated 14 November 2026 for version 1.4.0, ruleset `orchard-5`. This describes the current product and repository scenario. Root `PROJECT_STATUS.md` remains a historical progress snapshot; it does not define completion.

Reverse Snake is a browser game in `web/`, built with Next.js 16.4.5, React 19.3.1, TypeScript, Node 24 and Canvas. Escape Levels and Survival use ten maps and Easy, Normal and Hard. Hunter lets the player control the snake against an evasive fruit. Three timed local Challenges and completed-run Replays use separate routes. Light is the default theme; the original dark palette remains selectable in the click/tap/keyboard Menu. Fruit offers Hunter and Hunter offers Fruit, omitting their own mode link.

## Maps and progression

Levels begins with Canopy Clearing. Successful fruit movement earns 1 / 1.5 / 2 points per cell on Easy / Normal / Hard, including safe dash movement. Idle and blocked movement earns none. Reaching the current map's score target immediately saves access to the next map while the chase keeps running and scoring. Capture takes precedence over first-time qualification on the same simulation step. A Next map button becomes available; choosing it ends and records the current chase. Pause also offers End chase. Capture ends a run while keeping previously earned unlocks and stars. The snake shrinks as score progresses. A snake crash brings a replacement hunter that plans toward the current fruit, rather than clearing the level. Survival retains time scoring at 10 points/second times difficulty and constant-length replacement hunters. Food Survival and Hunter Survival offer all maps. Hunter Levels has its own saved sequence of score-gated maps; food catches earn 100 points times difficulty.

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

Stars are cumulative milestones above each map's unlock target T:

| Rating | Required score |
| --- | --- |
| 1 star | T + 100 |
| 2 stars | T + 300 |
| 3 stars | Strictly above T + 700 (T + 701 displayed points) |

The score bar marks unlock and star milestones. The best star rating per map persists across attempts and never falls when a later run earns less. The disabled/enabled Next map control keeps a stable height, avoiding a board resize when a target is met. Food progress stays in `reverse-snake:v1`; Hunter progress uses `reverse-snake:hunter-progress:v1`.

Unlocks persist in the existing `reverse-snake:v1` save. Older stored Levels wins migrate to progress. Clearing score history preserves unlocks and star ratings; clearing site data removes them. Setup rejects locked maps during Levels, and active/paused rounds freeze configuration. Old scores keep their historical values, so old and current Levels records are not directly comparable.

The board fills the outer playing rectangle with independent rows and columns, a target cell size of 18–30 CSS pixels and bounds of 12–96 cells per axis. Fullscreen increases the playable cell count. Entry and exit restore canvas focus and ignore transition-only blur while preserving input; actual tab/window suspension still pauses. Mid-chase keyboard and swipe entry/exit checks cover both player roles. Walls now scale by their full occupied footprint, retaining density instead of becoming sparse strips. Connected floor, legal spawn and resize checks cover all ten maps. Resize remaps actors into legal connected positions while retaining phase, elapsed time, score, boosts and learning; it is recorded for replay. Twenty-cell coordinates are authored terrain templates and legacy replay geometry, not a fixed live board.

## Controls and presentation

Menu contains one pair of named dropdowns: **Food character** and **Snake design**. Choose Apple, Mango, Pear, Orange or Strawberry and Amber, Jade, Coral or Midnight once; choices persist across rounds, routes and reloads until changed. Apple/Jade are fresh defaults. Choices freeze during active/paused play and are captured in recordings. Full fruit artwork and distinctive snake patterns retain cell-based hitboxes.

Base movement now follows the requested ratios, continuously using the fixed simulation clock. Snake pursuit replans around walls at lunge corners; evasive fruit uses full route distances, room to turn and recent-cell penalties instead of a capped distance preference that encouraged short oscillations.

| Mode | Difficulty | Food speed | Snake speed |
| --- | --- | --- | --- |
| Food | Easy | 10 cells/s | 5 cells/s |
| Food | Normal | 10 cells/s | 10 cells/s |
| Food | Hard | 8.33 cells/s | 12.5 cells/s |
| Hunter | Easy | 2.5 cells/s | 5 cells/s |
| Hunter | Normal | 7.5 cells/s | 10 cells/s |
| Hunter | Hard | 12.5 cells/s | 12.5 cells/s |

Hunter maps contain collectible lightning and snowflake power-ups. Lightning doubles snake speed for 10 active seconds. Stun freezes food for 5 active seconds. Collected items replenish after 8 active seconds; placement avoids walls, bodies, food and other items. Timers freeze during pause and survive resize. Status chips show remaining duration; effects and deterministic item state are included in recordings. Temporary boosts override base speed ratios.

On touch devices, swipe up, down, left or right on the board to continue moving in that direction. Another swipe changes direction. Taps do not steer. Double-tap after a swipe dashes three cells in the last direction with the existing four-second cooldown. There is no on-screen arrow pad or Dash button. Hunter uses swipes for turns and has no fruit dash. Desktop retains held WASD/arrows, Space dash, Esc pause, Enter start/resume and R restart. Pause/restart clears continuing swipe movement.

Compact phone/landscape layouts hide the hero and setup sidebar, putting mode, pace, map/course and saved character choices in Menu. The board occupies most of the viewport. Desktop keeps setup beside the game and a compact keyboard guide directly below the frame. Score-target progress and the map name sit above the board. Light/dark styling, reduced motion, sound, results and fullscreen remain available.

## Learning and replay

Both opponents use local neural behavior imitation: two networks with 14 inputs, 12 tanh hidden units and four softmax outputs train by backpropagation on successful human moves. Fruit movement teaches the fruit policy; human snake movement teaches the snake policy. Hunting combines fruit-turn prediction and learned snake preferences with legal routing. Evasion combines learned fruit choices and predicted snake movement. Difficulty changes anticipation and imitation strength as well as cadence/commitment. Learning persists separately in `reverse-snake:learning:v1`; failed storage retains it during the current visit. Imitation does not guarantee every habit improves an opponent.

A matching fruit-controlled ghost draws recorded full artwork once at 32% opacity without affecting collisions, scoring or training. Board geometry is part of matching; resize clears incompatible ghosts. A blurred translucent pause loops a separate recorded cursor while the live round and normal ghost remain frozen. First-visit pause can use the current prefix; reduced motion keeps the preview static. Unscored previews do not create completed score or replay entries.

New format-2 recordings use version 1.4.0 / `orchard-5`, capturing geometry, appearance, initial models, ordered actions and resize events. Deterministic training and playback verify the final fingerprint. Retained engines preserve 1.3.0 / `orchard-4`, 1.2.0 / `orchard-3` and 1.1.0 / `canopy-2` playback with their original terrain and rules. Three completed recordings remain bounded to 250 KB each and 180,000 steps. Scores omit model weights. Unknown/malformed versions and oversized recordings are rejected safely.

## Repository, verification and remaining scope

GitHub: [A4B4RG/Reverse-Snake-](https://github.com/A4B4RG/Reverse-Snake-), local branch `main`, tracking `origin/main`. The pre-update checkpoint is `720c9d189b7320c02eb084f99450a219f2c7cb23`. Source, tests, current reports and screenshots are delivered through the existing main integration; [RELEASE.md](RELEASE.md) records delivery evidence. The Python/Kivy prototype, native placeholders and historical `PROJECT_STATUS.md` are preserved.

Local verification includes movement and qualification rules, cumulative star boundaries and persistence, power-up pickup/expiry/pause/resize, actual speed ratios, seeded power-up replay, older ruleset playback, and real mid-chase fullscreen controls. Current command results and browser evidence are recorded in [VERIFICATION.md](VERIFICATION.md); [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) describes current screenshots. Physical-device balance feedback remains pending.

Verified main source/test revision `d0ae8f7bbd4de22aa50dfa5ac04fae948630b68b` passes [GitHub Linux CI](https://github.com/A4B4RG/Reverse-Snake-/actions/runs/43583761804): clean install, zero audit findings, 67 rules tests, lint, build, types and 61 browser passes with one existing headless visibility skip. Local full Chrome and Chromium suites also pass. Later documentation and test-setup corrections retain that gameplay implementation; VERIFICATION.md records the asynchronous geometry checks used in fullscreen and Survival tests.

Online PvP needs a realtime authoritative match service; the current Vercel address can remain the frontend and a custom domain is optional. [ONLINE_PVP.md](ONLINE_PVP.md) explains rooms, synchronization, storage and a practical first release. No online service has been added. Phaser, an editor and native Android packaging remain separate work; see [technical decisions](TECHNICAL_DECISIONS.md).

Updated Vercel Preview/production gameplay remains **NOT VERIFIED** under the user's explicit hosted-check waiver. A main push is not proof of the deployed version at https://reverse-snake-chi.vercel.app. Physical devices, Safari/Firefox, external player balance and a full nonvisual accessibility audit remain unverified; see [known limitations](KNOWN_LIMITATIONS.md).
