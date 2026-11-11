# Phaser migration options — proposal for approval

Date: 10 November 2026. **No migration has been performed.** This recommendation follows the [M0 audit](REPOSITORY_AUDIT.md) and the user's requirement to use Phaser. It preserves the milestone order in `reverse-snake-prompts.md`.

## Compare the options

| Option | Benefits | Costs / risks supported by current evidence | Recommendation |
| --- | --- | --- | --- |
| A. Continue with the existing Canvas implementation | Least immediate work; 13 passing tests and a working UI already exist. | Does not meet the requested Phaser ownership model; hook and Canvas have separate RAF loops, input acts outside the tick, no Phaser asset/scene lifecycle. | Keep it as the temporary baseline, not the final architecture. |
| B. Retain the shell and pure rules; integrate Phaser incrementally | Reuses tested collisions, arenas, saves and menus; isolates lifecycle work from gameplay changes; makes regressions attributable to a small change. | Requires a deliberate scheduler/input transition and event bridge; old and new controllers must never run the same world together. | **Recommended**, subject to user approval. |
| C. Replace the entire application with a new Phaser project | Could choose a uniform architecture from scratch. | Rebuilds working Next routes, responsive UI, dialogs, persistence, accessibility and tests without evidence that these need replacement. Larger review and rollback burden, especially with Git deferred. | Reject for the current repository. |

## Why an incremental change fits this code

| Repository evidence | Resulting recommendation |
| --- | --- |
| `src/lib/game.ts` has no React/DOM/Phaser dependency. Tests import it directly. | Retain pure calculations and regression fixtures. Phaser invokes rules; sprites do not become the authoritative state. |
| `src/hooks/use-game.ts` owns the accumulator and input actions; `game-canvas.tsx` owns a separate draw RAF. | Transfer scheduling/render ownership to one Phaser runtime when gameplay is ported. Remove the old active loop from that mount rather than layering another clock over it. |
| `steer()` and `dash()` can act between steps; H-01 is reproduced. | Decide action timing, held-key priority and input buffering in M1 before porting behavior. Consume approved actions at fixed simulation boundaries. Preserve responsiveness through feedback/rendering rather than granting extra movement. |
| React already owns menus, setup, HUD, guide, results and local records. | Keep the existing React shell. Replace the world mount and its controller boundary, not the entire page. |
| Full game snapshots are sent to React about every 80 ms. | Use a typed bridge for changed HUD values, phase/results and user commands. Do not stream positions/body arrays into React every tick or frame. |
| `storage.ts` validates local saves, but terminal handling assumes UUID support. | Retain versioned persistence; isolate optional side effects from terminal simulation. Fix/test M-01 in an approved implementation milestone. |
| `layout.tsx` is a Server Component; browser APIs are currently inside client effects. | Keep Phaser imports behind a browser-only client boundary. A `"use client"` declaration alone does not disable prerendering. |
| Installed Next 16.4.5 lazy-loading guide says `ssr: false` is only supported in Client Components. | Use a small client wrapper with a dynamically loaded Phaser mount (`ssr: false`), or an equivalent guarded effect import; never evaluate Phaser at server-module scope. |
| Five arenas and 13 passing tests already encode useful prototype behavior. | Keep them as a comparison baseline; only change rules when M1 approves the difference and relevant tests change with it. |
| No shared account/application store exists. | A small typed event bridge is sufficient initially; do not add Zustand without a demonstrated UI-state need. |

Framework sources read: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` and the current app's `AGENTS.md`. Recheck the relevant installed-version guides when implementing, rather than copying an older Next template.

## Dependency choice and maintenance

Phaser 3 is justified by the requested scene, asset, rendering and world lifecycle ownership. Phaser 3.90.0 availability/MIT metadata was verified during Step 1; it is **not installed**. At M2, verify the approved compatible Phaser 3 version and install only the necessary package with the lockfile update. Do not silently take a different major release.

The existing Canvas API is the dependency-free alternative, but does not fulfill the requested Phaser architecture. A full replacement starter or React-Phaser wrapper adds another abstraction without an identified need. Phaser's own types plus a small project-owned mount/bridge should suffice initially. Maintenance costs include browser-only import handling, bundle/download size, scene cleanup, asset errors and compatibility testing. Measure the actual added bundle in M2; no size or performance improvement is promised by this audit.

No new state library, physics engine, ML runtime, backend SDK or deployment service is required for the foundation milestone. Grid rules should remain pure TypeScript; adding physics would change collision semantics without a current requirement.

## Staged implementation, after approval

1. **Step 3 / M1 — contracts only.** Specify Hunter, Prey and deferred Challenge scope; tick/input/turn rules; collision order; pause/restart; score/versioning; seeds; legal states; ownership and events. Treat current speeds and the 2.6-second edge win as provisional behavior to review, not accepted balance. Produce the four requested design/architecture documents, then stop for review.
2. **Step 4 — creative direction.** Present the visual direction and asset request sheet. Request approval of theme and character concepts, arena layouts, icons, title/UI and sound identity at the stated gates. Keep current drawings identified as prototype assets. No final art production before approval.
3. **Step 5 / M2 — Phaser foundation only.** Add the browser-only mount, minimal boot/loading and game scenes, placeholder geometric board, typed bridge, resize and complete shutdown. Preserve the route and unrelated UI. Keep the prototype and foundation preview as mutually exclusive mounts so only one game controller is active. Do not implement Hunter or port Prey gameplay in this milestone.
4. **Step 6 / M3 — Hunter.** Implement the approved Hunter loop and deterministic rules/tests within the Phaser foundation. Reuse collision/grid helpers where their semantics match; do not bend Prey-specific outcomes into Hunter behavior without tests.
5. **Step 7 / M4 — Prey.** Port approved Prey rules into the same foundation. Retain arena/collision/dash calculations where valid, move simulation/input ownership from `useGame` to Phaser, and keep persistence/results in the shell. Ensure the old Canvas/hook controller is no longer mounted for the Phaser game.
6. **Subsequent milestones.** Complete controls/mobile validation in M5, feedback/audio in M6, approved content in M7, conventional AI evaluation in M8, replay/challenges in M9, optional ML experiment in M10, online platform in M11 and production hardening in M12. Do not use this recommendation as permission to skip the intervening reviews.

Each completed step is reviewed at **http://localhost:599** and then paused. Public sharing stays stopped until the user explicitly says to start sharing. Git setup remains deferred; keep early integration additive/reversible, and establish an agreed checkpoint before any later destructive removal.

## Lifecycle and event-boundary requirements for M2

These are proposed implementation acceptance checks, not features claimed to exist today:

- One Phaser instance per mounted host; asynchronous loading must not create an instance after unmount. Development remounts must not duplicate canvases, scene listeners, RAF owners or audio contexts.
- Destroy the Phaser instance and unsubscribe both sides of the bridge on unmount. Verify mount → unmount → mount, route re-entry and resize.
- Phaser owns world state and simulation scheduling. Pure functions define grid rules; render objects only represent state. An accumulated fixed step must use the approved suspension/catch-up policy.
- React sends commands and receives meaningful changed values/outcomes. No per-frame position snapshots, duplicate save calls or shadow simulation in React.
- Keep one input ownership model for keyboard/pointers. Blur, pointer cancel and restart clear pending commands as specified; normalized key identity prevents mixed-case releases from sticking.
- Keep asset paths/loading errors explicit and local; a failed asset should produce a reviewable failure state rather than a blank canvas.
- Verify the existing route, SSR/hydration, one canvas, scene startup/shutdown, responsive resize and no browser-global errors. Rerun existing test/lint/typecheck/build checks. Add targeted lifecycle tests alongside the implementation, not speculative tests in M0.

## Retention and replacement boundaries

**Retain:** Next application, Tailwind/CSS structure, modal/accessibility scaffolding, local font/icon dependencies and notices, pure collision/grid helpers, arena data, storage validation and tests. Preserve original Python/native placeholders as reference.

**Adapt when their milestone is approved:** phase/type model, input timing, typed commands/events, terminal side-effect isolation, score-rule versioning, approved visuals and mobile control sizes.

**Replace only at the gameplay-port boundary:** active Canvas renderer and the hook's simulation scheduler. Do not run them beside a Phaser controller for the same run. Do not delete historical source or old artifacts during this audit.

## Decision requested

Approve **Option B: retain the shell and reusable rules, define contracts first, add a minimal Phaser foundation at M2, then implement modes in order**. Approval to continue should begin **Step 3 / M1**, not immediate installation or migration. No Git account, hosting service or art file is needed for that next documentation step.
