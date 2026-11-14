# Current browser product

Updated 14 November 2026 for version 1.5.0, ruleset `jungle-6`. This describes the current product and repository scenario. Root `PROJECT_STATUS.md` remains a historical progress snapshot; it does not define completion.

Reverse Snake is a browser game in `web/`, built with Next.js 16.4.5, React 19.3.1, TypeScript, Node 24 and Canvas. Escape Levels and Survival use thirty maps and Easy, Normal and Hard. Hunter lets the player control the snake against an evasive fruit. The home route presents the logo and Start, then Hunter/Food selection and role-specific instructions. Food plays at `/food`; Hunter, three timed local Challenges and completed-run Replays have their own routes. New Food and Hunter sessions begin on Easy; saved Food difficulty remains respected. Light is the default theme; the original dark palette remains selectable in the click/tap/keyboard Menu. Fruit offers Hunter and Hunter offers Fruit, omitting their own mode link.

## Maps and progression

Levels begins with Canopy Clearing. Successful fruit movement earns 1 / 1.5 / 2 points per cell on Easy / Normal / Hard, including safe dash movement. Idle and blocked movement earns none. Reaching the current map's score target immediately saves access to the next map while the chase keeps running and scoring. Capture takes precedence over first-time qualification on the same simulation step. A Next map button becomes available; choosing it ends and records the current chase. Pause also offers End chase. Capture ends a run while keeping previously earned unlocks and stars. Food hunters grow every 20 active seconds on Easy and 10 on Normal/Hard. Collision trims two tail cells and stuns the hunter in place for 1.6 seconds; a close dodge trims one. After stun its tail becomes its head and pursuit resumes. From 60 seconds, a body of at least 18 cells divides once into two disjoint hunters. They cannot overlap; simultaneous collision freezes both complete bodies and makes both tails lead afterward. Splitting applies to Food Levels/Survival only. Survival retains time scoring at 10 points/second times difficulty. Food Survival and Hunter Survival offer all maps. Hunter Levels has its own saved sequence of score-gated maps; food catches earn 100 points times difficulty.

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
| 11 | Fern Passage | 1500 | Staggered stems and corners |
| 12 | Monsoon Steps | 1700 | Offset horizontal steps |
| 13 | Emerald Ruins | 1900 | Four broken stone enclosures |
| 14 | Vine Crossing | 2100 | Crossing walls and branches |
| 15 | Tiger Grass | 2300 | Alternating stems and baffles |
| 16 | Sunken Shrine | 2500 | Nested open shrines |
| 17 | Firefly Marsh | 2700 | Broken lanes and vertical branches |
| 18 | Lotus Basin | 2900 | Broad banks with inner walls |
| 19 | Moss Columns | 3100 | Uneven columns and footing |
| 20 | Ancient Spiral | 3300 | Nested elbows and broken spiral |
| 21 | Rainforest Rapids | 3500 | Offset banks and narrow gaps |
| 22 | Serpent Gates | 3700 | Tall outer gates and inner turns |
| 23 | Jade Gardens | 3900 | Four solid stone gardens |
| 24 | Orchid Tangle | 4100 | Interlocking corners and stems |
| 25 | Moonlit Causeway | 4300 | Parallel banks with staggered pillars |
| 26 | Mangrove Channels | 4500 | Alternating channels and roots |
| 27 | Lost Sanctuary | 4700 | Broken enclosure and inner gates |
| 28 | Jaguar's Labyrinth | 4900 | Layered elbows and branching exits |
| 29 | Thunder Canopy | 5100 | Stepped walls and perpendicular roots |
| 30 | Jungle Citadel | 5300 | Nested citadel walls and baffles |

Stars are cumulative milestones above each map's unlock target T:

| Rating | Required score |
| --- | --- |
| 1 star | T + 100 |
| 2 stars | T + 300 |
| 3 stars | Strictly above T + 700 (T + 701 displayed points) |

The score bar marks unlock and star milestones. The best star rating per map persists across attempts and never falls when a later run earns less. The disabled/enabled Next map control keeps a stable height, avoiding a board resize when a target is met. Food progress stays in `reverse-snake:v1`; Hunter progress uses `reverse-snake:hunter-progress:v1`.

Unlocks persist in the existing `reverse-snake:v1` save. Older stored Levels wins migrate to progress. Clearing score history preserves unlocks and star ratings; clearing site data removes them. Setup rejects locked maps during Levels, and active/paused rounds freeze configuration. Old scores keep their historical values, so old and current Levels records are not directly comparable.

The board fills the outer playing rectangle with independent rows and columns, a target cell size of 18–30 CSS pixels and bounds of 12–96 cells per axis. Fullscreen increases the playable cell count. Entry and exit restore canvas focus and ignore transition-only blur while preserving input; actual tab/window suspension still pauses. Mid-chase keyboard and swipe entry/exit checks cover both player roles. Walls now scale by their full occupied footprint, retaining density instead of becoming sparse strips. Connected floor, legal spawn and resize checks cover all thirty maps. Scaled layouts carve doorways where needed to keep the floor connected. Resize remaps actors into legal connected positions while retaining phase, elapsed time, score, boosts and learning; it is recorded for replay. Twenty-cell coordinates are authored terrain templates and legacy replay geometry, not a fixed live board.

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

Hunter grows from active time as well as catches. Hard walls begin relocating at 45 active seconds and repeat every 30 seconds. The old walls sink for 600 ms, then the incoming layout activates and rises for 600 ms. Placement excludes actors/items at activation, and relocation candidates keep the floor connected. Resize preserves the current dynamic terrain. Hunter remains one controlled snake.

Golden halos and revolving stars show stunned Food hunters and stunned Hunter fruit. Lightning draws electricity in the inverse of the selected snake body color. Every capture emits a brief jaw/teeth bite with crumbs. Reduced motion keeps static status artwork while removing moving effects.

Menu → Play settings stores frame rate, touch sensitivity, music and volume locally. Drawing defaults to 30 FPS; 60 is available on all devices, mobile 90 requires measured display support, and desktop offers up to 120. Actual delivery follows the display's animation cadence; the 20 ms simulation stays independent. A saved desktop 120 setting is capped on mobile. Touch sensitivity 1–10 adjusts the swipe threshold from 44.4 to 12 CSS pixels. Double-tap accepts small finger jitter, uses the last swipe direction, and retains the four-second dash cooldown.

The welcome screen includes an animated snake wrapping the Hunter card and an apple revealing itself behind Food on hover or keyboard focus. Phone/short-screen instructions use four selectable tips so the Play option stays in view. Original jungle music combines synthesized piano, violin, viola and cello in a 42.67-second loop. It begins after a user gesture, offers music/volume settings and suspends while the tab is hidden. No Pokémon recording or melody is copied.
On touch devices, swipe up, down, left or right on the board to continue moving in that direction. Another swipe changes direction. Taps do not steer. Double-tap after a swipe dashes three cells in the last direction with the existing four-second cooldown. There is no on-screen arrow pad or Dash button. Hunter uses swipes for turns and has no fruit dash. Desktop retains held WASD/arrows, Space dash, Esc pause, Enter start/resume and R restart. Pause/restart clears continuing swipe movement.

Compact phone/landscape layouts hide the hero and setup sidebar, putting mode, pace, map/course and saved character choices in Menu. The board occupies most of the viewport. Desktop keeps setup beside the game and a compact keyboard guide directly below the frame. Score-target progress and the map name sit above the board. Light/dark styling, reduced motion, sound, results and fullscreen remain available.

## Learning and replay

Both opponents use local neural behavior imitation: two networks with 14 inputs, 12 tanh hidden units and four softmax outputs train by backpropagation on successful human moves. Fruit movement teaches the fruit policy; human snake movement teaches the snake policy. Hunting combines fruit-turn prediction and learned snake preferences with legal routing. Evasion combines learned fruit choices and predicted snake movement. Difficulty changes anticipation and imitation strength as well as cadence/commitment. Learning persists separately in `reverse-snake:learning:v1`; failed storage retains it during the current visit. Imitation does not guarantee every habit improves an opponent.

A matching fruit-controlled ghost draws recorded full artwork once at 32% opacity without affecting collisions, scoring or training. Board geometry is part of matching; resize clears incompatible ghosts. A blurred translucent pause loops a separate recorded cursor while the live round and normal ghost remain frozen. First-visit pause can use the current prefix; reduced motion keeps the preview static. Unscored previews do not create completed score or replay entries.

New format-2 recordings use version 1.5.0 / `jungle-6`, capturing geometry, appearance, initial models, ordered actions and resize events. Growth, splitting, in-place stuns, seeded powers and wall relocation reproduce during playback. Deterministic training and playback verify the final fingerprint. Retained engines preserve 1.4.0 / `orchard-5`, 1.3.0 / `orchard-4`, 1.2.0 / `orchard-3` and 1.1.0 / `canopy-2` playback with their original terrain and rules. Three completed recordings remain bounded to 250 KB each and 180,000 steps. Scores omit model weights. Unknown/malformed versions and oversized recordings are rejected safely.

## Repository, verification and remaining scope

GitHub: [A4B4RG/Reverse-Snake-](https://github.com/A4B4RG/Reverse-Snake-), local branch `main`, tracking `origin/main`. The pre-update checkpoint is `9212c6387077628d771c83205ddc7beef33408c4`. Source, tests, current reports and screenshots are delivered through the existing main integration; [RELEASE.md](RELEASE.md) records delivery evidence. The Python/Kivy prototype, native placeholders and historical `PROJECT_STATUS.md` are preserved.

Local verification includes movement and qualification rules, cumulative star boundaries and persistence, power-up pickup/expiry/pause/resize, actual speed ratios, seeded power-up replay, older ruleset playback, and real mid-chase fullscreen controls. Current command results and browser evidence are recorded in [VERIFICATION.md](VERIFICATION.md); [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md) describes current screenshots. Physical-device balance feedback remains pending.

Current release verification and exact GitHub main delivery are recorded in [VERIFICATION.md](VERIFICATION.md) and [RELEASE.md](RELEASE.md). The existing GitHub Actions workflow runs clean install, audit, rules, lint, production build, TypeScript and Chromium browser tests against each pushed revision.

Online PvP needs a realtime authoritative match service; the current Vercel address can remain the frontend and a custom domain is optional. [ONLINE_PVP.md](ONLINE_PVP.md) explains rooms, synchronization, storage and a practical first release. No online service has been added. Phaser, an editor and native Android packaging remain separate work; see [technical decisions](TECHNICAL_DECISIONS.md).

Updated Vercel Preview/production gameplay remains **NOT VERIFIED** under the user's explicit hosted-check waiver. A main push is not proof of the deployed version at https://reverse-snake-chi.vercel.app. Physical devices, Safari/Firefox, external player balance and a full nonvisual accessibility audit remain unverified; see [known limitations](KNOWN_LIMITATIONS.md).
