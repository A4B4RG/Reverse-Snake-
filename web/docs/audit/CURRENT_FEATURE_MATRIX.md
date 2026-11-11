# Current feature matrix — M0

Audited 10 November 2026. Application paths below are relative to `web/`. “Present” means implemented in the prototype; it does not imply production readiness. “Partial” identifies a real implementation with a specific gap. Future features are not classified as current bugs.

| Feature | Status | Evidence / limits | Retain or next milestone |
| --- | --- | --- | --- |
| Next.js / React / TypeScript shell | Present | `src/app/*`, strict `tsconfig.json`; build/typecheck pass. | Retain. |
| Tailwind CSS | Present | PostCSS integration and `@import "tailwindcss"`; much styling is authored CSS. | Retain; no rewrite necessary. |
| Phaser 3 | Absent | No package or scene/mount implementation. Registry access verified in Step 1. | Step 5 / M2, after approval. |
| Hunter mode | Absent | Player currently controls prey only. | M3; add food/growth/rules after M1. |
| Prey / Survival mode | Present prototype | `game.ts`, UI/canvas, unit tests and browser win/loss. | Retain as reference; approved Phaser version in M4. |
| Challenge mode | Absent | No fixed challenge definitions, seed or replay. | Rules in M1; systems in M9. |
| One hunting snake | Present | Manhattan pursuit and alternating lunges; difficulty tests. | Reuse pure heuristic initially. |
| Multiple snakes | Absent | `GameState` has a single snake array. | Define scope before implementing. |
| Grid / obstacles / arenas | Present | 20×20, five hardcoded layouts, valid-spawn tests. | Retain data; final layouts require creative approval. |
| Fixed simulation step | Partial | 20 ms `step`, accumulator; fresh steer/dash bypass scheduler. | Address H-01 through approved M1/M4 input rules. |
| Explicit phase | Partial | Five-value union and action guards; no legal-transition contract. | M1 specification; later regression tests. |
| Direction priority | Partial | Most recent held key wins; no tick queue; case/pointer risks. | M1/M5 control contract. |
| Wall/hedge collision | Present | Player blocked; snake crash wins. Unit tests. | Retain pure calculations. |
| Whole-body / departing-tail collision | Present | Every segment lethal to prey; snake may enter departing tail. Tests. | Preserve explicit ordering. |
| Valid initial spawn | Present | Fixed path/player spawn; all five arenas tested. | Retain fixtures, expand for Hunter. |
| Food generation / growth / full board | Absent | Apple is the prey character, not a spawned collectible. | M3 Hunter rules/tests. |
| Dash | Present prototype | Three checked cells, 4-second cooldown; tests and UI input. | Reuse calculations, queue approved actions. |
| Other abilities / hazards | Absent | Static hedge obstacles only. | M7 after contracts and art gates. |
| Hunger / shortening | Present | 55–75 s arena timers and minimum length 3. Fixture tests. | Retain provisionally; playtest balance. |
| Three difficulties | Present | 260/200/140 ms enemy intervals, score multipliers. | Values provisional, not validated balance. |
| Scores / results / retry | Present | Time plus win bonus, distinct outcomes; tests and UI checks. | Retain UI/rules, define versioning in M1/M9. |
| Keyboard controls | Partial | WASD/arrows, Space/Escape/Enter/R; event.key casing risk. | Retain UX; normalize ownership/buffering in M5. |
| Touch controls | Partial | Pointer-captured D-pad and Dash; no swipe, shared owner risk. | Improve sizes and physical-device coverage in M5. |
| Pause / focus / restart | Present prototype | Hook clears direction, pauses hidden/blur; fresh state on restart. | Preserve; add lifecycle tests before replacement. |
| Desktop/mobile layout | Present prototype | CSS breakpoints; 1440, 390 and 320 px checks without overflow. | Real Android/iOS validation still required. |
| Fullscreen | Present, not re-tested in M0 | Guarded request/exit and fallback notice in component. | Verify target-browser behavior in M5. |
| Onboarding / help | Partial | Ready screen, labels, field guide and tips. | First-session comprehension not user-tested. |
| Accessibility | Partial | Labels, focus, dialog/live status/skip link; low contrast/tiny text. | Design fixes and assistive-tech testing required. |
| Reduced motion | Partial | OS preference used by CSS/canvas; no dedicated setting. | Contract/creative review determines settings. |
| Local saves | Present with risk | Bounded/validated localStorage; UUID assumption M-01. | Retain format with tested migrations if changed. |
| Local best runs | Present | Last 30 saved, top five shown; browser reload verified. | Personal records only. |
| Accounts / online leaderboard | Absent | No backend, auth, database or authoritative score pipeline. | M11; local saves cannot establish score integrity. |
| Deterministic seed / replay | Absent | Rules repeat for identical function calls, but no seed/input log. | Contract in M1, replay/challenges M9. |
| AI evaluation / pathfinding | Partial | Heuristic present; no benchmark corpus, comparative metrics or pathfinding. | M8 conventional AI before ML. |
| Machine learning | Absent | Empty Python/native placeholders, no trained model. | Optional gated M10 experiment only. |
| Sound | Present prototype | Local Web Audio synthesis; UI toggle and cleanup. | Final identity and real-device playback still unapproved. |
| Final approved art | Absent | Local geometric/SVG prototype assets and external licensed fonts/icons. | Step 4 character/theme/arena/icon/sound gates. |
| Automated logic/save tests | Present | 13/13 passing; `tests/game.test.ts`. | Retain and expand only as behavior changes. |
| E2E / Phaser lifecycle tests | Absent | No configured suite for DOM events/mount/disposal. | Add targeted checks with M2 integration. |
| Build / lint / typecheck | Present, passing | Commands rerun in M0. | Preserve checks. |
| Reproducible install evidence | Partial | Matching lockfile, but 54 extraneous installed packages; no fresh `npm ci` run. | Validate clean install later without altering this review environment. |
| Public deployment | Stopped by user | No new sharing/deployment action in M0. Stale `out/` is not current output. | Only resume on explicit request. |
| Local milestone review | Present | HTTP 200 and verified browser at `http://localhost:599`. | Continue review at each approved step. |
| Git / CI | Deferred / absent | No repository metadata or CI workflow. | User explicitly deferred Git setup. |

See [the audit](REPOSITORY_AUDIT.md) for commands, actual coverage, licenses and evidence distinctions; see [issues](PRIORITISED_ISSUES.md) for defects/risks rather than future scope.
