# Prioritised issues — M0

**11 November 2026 update:** the user subsequently authorized gameplay add-ons and fixes for H-01 and M-01 through M-04, then selected the Deep canopy graphics direction. These are now implemented and verified; M-05 control sizing and a narrow M-06 browser suite were also added. See [Step 2 add-ons](../STEP_2_ADDONS.md) and [current verification](../VERIFICATION.md). The findings below preserve the original audit evidence. Other backlog items remain separate future work.

Date: 10 November 2026. Paths below are relative to `web/`, except the explicitly marked legacy paths. This is an audit backlog, not a claim that fixes were made. Suggested milestone placement is a proposal; gameplay/design changes require the corresponding approval.

Severity reflects impact on the requested browser game: **critical** prevents safe basic operation; **high** undermines core rule consistency; **medium** affects compatibility, input, accessibility or development reliability; **low** is bounded maintainability/performance/provenance debt. Unimplemented future modes are listed in the [feature matrix](CURRENT_FEATURE_MATRIX.md), not inflated into bug counts.

## Critical

**None identified in the inspected browser app and tested localhost cases.** This is not a guarantee across untested browsers, devices or future online systems.

## High

### H-01 — Input events bypass the simulation movement budget

- **Verified:** `src/lib/game.ts:86–87` moves on every `steer()` call and resets `playerClock`. `reverse-snake.tsx:43–47,136` calls it on fresh key/pointer presses; the regular movement step is separately scheduled at 100 ms.
- **Reproduction:** start a normal Garden state and call `steer(state, "left")` five times without `step()`: player moves from `(5,13)` to `(0,13)` at `elapsed=0`. Five fixed steps with held left advance 100 ms and only one cell. `diagnostic-probes.log` records both results.
- **Impact:** rapid tapping can outrun held movement; a future tick-indexed replay/challenge cannot reproduce actions correctly unless input timing/order is explicitly represented. Dash is also an out-of-tick mutation, though its cooldown bounds repeated use.
- **Proposal:** decide responsive movement and buffering in M1; consume approved commands on simulation ticks when gameplay is implemented/ported. Add a meaningful test asserting equal movement budgets for equivalent elapsed time/input intent, plus replay timing tests when replay exists. Preserve the current immediate-steer test until the rule change is approved.

## Medium

### M-01 — Missing UUID support can interrupt terminal handling

- **Verified probe / source-derived browser risk:** `storage.ts:29–35` calls `crypto.randomUUID()` unguarded. An isolated process with that method unavailable throws `TypeError: crypto.randomUUID is not a function`.
- **Impact:** `use-game.ts:27–30,57–69` records before setting terminal React state/scheduling the next frame. In a browser without that API, notably an insecure non-localhost HTTP context, the exception can halt that path. This did not occur on localhost.
- **Proposal:** when implementation work is approved, supply an appropriate local-record ID fallback and isolate optional persistence/audio failures from terminal events and frame scheduling. Test absent UUID and throwing side effects. These IDs are not security credentials and do not provide online score integrity.

### M-02 — Key identity can change between press and release

- **Source-derived:** `reverse-snake.tsx:11,43–54` stores exact `event.key` strings, including separate uppercase/lowercase entries. A `W` keydown followed by a `w` keyup does not remove `W`.
- **Impact:** releasing Shift before a held movement key can leave movement active until another reset/focus change. Not reproduced with physical mixed-modifier input in this audit.
- **Proposal:** define normalized input identity or physical `event.code` semantics in M1/M5; test modifier changes, multiple held keys and blur cleanup. Account for keyboard layout deliberately.

### M-03 — Pointer/key ownership is shared without arbitration

- **Source-derived:** D-pad `onPointerUp`, `onPointerCancel` and `onLostPointerCapture` all clear the same `directionRef` (`reverse-snake.tsx:136`), regardless of which pointer/key currently supplies direction.
- **Impact:** releasing one contact can cancel another held contact or keyboard input. Simple single-pointer interaction worked; multi-touch/keyboard overlap was not device-tested.
- **Proposal:** keep pointer IDs and held-key ownership in one normalized adapter; decide priority and release fallback, then test cancellation/interleaving in M5.

### M-04 — Supporting text lacks sufficient contrast/readability

- **Verified CSS/DOM sample:** `globals.css` hero copy, difficulty caption and score note are 3.52:1, 3.75:1 and 2.80:1 against the paper background; normal-text target is 4.5:1. Supporting labels frequently use 6–10 px text.
- **Impact:** important instructions and secondary information can be difficult to read, especially on phones. Desktop/mobile screenshots provide review evidence.
- **Proposal:** adjust palette/typography during visual approval and implementation. Measure actual text/background pairs and test zoom/assistive technology; do not equate a few fixes with a complete WCAG audit.

### M-05 — Mobile controls need a larger comfort target

- **Verified:** at 390 px viewport, D-pad is 39×33 px and pause/fullscreen 28×28 px; Dash is 67×67 px. Arena strips are visually 3 px with a small expanded hit area (`globals.css`).
- **Impact:** fast touch play requires precise taps. Existing alternatives/spacing matter to formal accessibility conformance; these dimensions alone are not a blanket WCAG failure.
- **Proposal:** approve a 44×44-or-larger comfort target for frequent controls, then test physical devices, adjacent target spacing, orientation and multi-touch during M5.

### M-06 — Integration and target-browser regressions are not automated

- **Verified:** the configured suite contains 13 pure-engine/storage tests only. No DOM input, React lifecycle or E2E suite exists.
- **Impact:** pure tests cannot catch duplicate Phaser mounts, stale listeners, focus bugs or mobile API differences introduced by migration.
- **Proposal:** add a narrow scene/mount/cleanup integration suite with M2 and UI input tests with M5. Keep existing fast rules tests. Physical Android/iOS and Safari/Firefox checks remain separate validation work; viewport emulation does not substitute for them.

### M-07 — Development lint dependency advisory

- **Verified:** `npm audit --json` exits 1 and reports seven moderate affected entries for [minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249), via TypeScript ESLint. All reported nodes are `dev: true` in the lockfile. No high/critical or runtime dependency finding appeared in this report.
- **Impact:** development-tool dependency risk, not demonstrated exploitation through game controls.
- **Proposal:** review the currently available compatible TypeScript ESLint/Next lint dependency update in an approved maintenance change; rerun lint/typecheck/build/tests and audit. Do not apply a forced downgrade or automatic major-version fix. No dependency was changed in M0.

### M-08 — Session balance is unvalidated

- **Verified behavior, hypothesis about impact:** normal Garden edge bait wins in 2.6 seconds / 1,539 points; this is consistent with `tests/game.test.ts:49` and was observed in browser play. Five arenas share deterministic spawn positions and the AI is a short greedy lunge heuristic.
- **Impact hypothesis:** the same early strategy may reduce replay value or dominate score comparisons. Wall bait is an intended mechanic, not a proven defect.
- **Proposal:** agree session-length and challenge hypotheses in M1, then measure player outcomes before tuning conventional AI/content. Do not remove baitability or introduce ML as an untested fix.

## Low

### L-01 — Idle redraw and duplicate loop ownership

**Verified source:** `game-canvas.tsx:41–98` redraws even when inactive; `use-game.ts` has another RAF and emits whole-state UI snapshots every 80+ ms. DPR is read only on mount. **Proposal:** one Phaser scheduler when ported, changed-value HUD events, bounded DPR/resize handling and idle behavior; profile frame time/memory on target devices before claiming an optimization. No measured FPS or battery regression is asserted.

### L-02 — Interface responsibilities are concentrated

**Verified:** `reverse-snake.tsx` contains key/pointer routing, setup, HUD, results and three dialog bodies; state is structurally permissive despite a useful phase union. **Proposal:** document boundaries/terminal invariants in M1, then extract components/adapters as the approved integration needs them. Avoid a broad cleanup rewrite solely for style.

### L-03 — Installed/generated sharing remnants and historical docs

**Verified:** `out/` is stale; `npm ls` lists 54 extraneous packages including `serve`; existing README/verification discuss earlier ports and November 4 results. Lint currently passes because Next's inherited ignores include `out/**`. **Proposal:** use source/current audit as authority; later validate `npm ci` in an agreed clean environment and remove obsolete generated artifacts only in an approved cleanup. Do not publish stale output. This audit did not start sharing or delete anything.

### L-04 — Art provenance and final approval are incomplete

**Verified:** runtime drawings are repository-local code; font/icon license files exist, but there is no per-asset provenance register or root project license. No evidence records approval of the current art as final production artwork. **Proposal:** keep it explicitly provisional; at Step 4 request character/theme/arena/icon/sound approvals and record sources/licenses. Preserve OFL, ISC and Feather MIT notices when distributing assets.

### L-05 — Local-save semantics need an explicit future contract

**Verified:** local best/counters are trusted, date strings only type-checked, active runs/arena are not saved, and tabs do not reconcile saves (`storage.ts`, `use-game.ts`). **Proposal:** define expected persistence in M1 and version migrations if needed. Keep local records separate from future authoritative online scores; do not add a backend for this audit.

## Legacy-only findings

Root `screens/game_screen.py` has immediate neck collision and a scheduler that continues across screen changes; `screens/options_screen.py` has an unused Torch import. There is no reproducible Python dependency/test setup. These were source-inspected, not runtime-reproduced in M0. They do not block the current browser audit; keep the prototype as historical reference.

## Review boundary

M0 is complete when these findings and the [incremental migration strategy](MIGRATION_OPTIONS.md) are understandable. Fixing this backlog is not part of M0. The next decision is approval to start Step 3 / M1 contracts; it does not authorize skipping design gates or immediately migrating gameplay.
