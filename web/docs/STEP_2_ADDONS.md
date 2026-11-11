# Step 2 add-ons

Date: 11 November 2026. This implements the user's requested add-ons to the audited browser edition. It does not advance the separate Phaser migration milestones.

## Approved graphics direction

The user selected **Deep canopy: dark teal jungle, amber patterned snake, golden mango, turquoise leaf trails** after being asked to choose or suggest a design. Implementation proceeded after that reply.

- Dark teal forest floor with subtle cell dots, fronds outside playable cells, mossy stone obstacles and leaf-shaped interface accents.
- Amber snake with dark diamond markings and a golden mango replaces the lime snake / red apple palette.
- Five existing layouts retain their grid rules and indices; their jungle names are Canopy Clearing, Root Divide, Mango Grove, Temple Hollow and Wild Heart. Saved arena indices remain compatible.
- Page, menus, HUD, favicon and character icons follow the chosen palette. Art is authored in the repository's Canvas/SVG/CSS code; no external raster art was introduced. Existing bundled font and icon licenses continue to apply.

## Close-call rules

A safe player move **from Manhattan distance 1 beside the snake's head to a distance greater than 1** triggers a close call. Collision is checked first. Moving beside the body alone, standing still and blocked movement cannot trigger it.

| Mode | Duration | Movement |
| --- | --- | --- |
| Levels | 2 active seconds | 50ms average interval, versus 100ms normally |
| Survival | 5 active seconds | 50ms average interval, versus 100ms normally |

Every qualifying dodge resets the full duration without cooldown; durations do not stack and speed stays 2×. Because the simulation uses 20ms steps, the 50ms interval alternates between 40ms and 60ms beats. A safe dash can trigger the boost. Manual dash retains its independent four-second recharge. Pause freezes all boost timers; restart clears them.

Feedback includes a turquoise leaf burst at the dodge, a short leaf trail, a fruit aura, a border cue, a named countdown and a screen-reader announcement. Reduced motion suppresses the moving burst and trail while preserving the static aura and countdown.

Survival is selectable from setup. It keeps the hunter's length, replaces a crashed hunter at a clear edge, and continues until capture. Levels retain hunger and crash victories. Restart/end-round preserve the selected mode. Completed runs record mode and close-call count; older records default to Levels and zero close calls.

## Audit issue resolutions

| Issue | Implemented change | Evidence |
| --- | --- | --- |
| H-01 rapid presses bypass timing | Buffer presses and consume them on movement ticks; idle time cannot bank movement | Movement-budget and quick-tap unit tests; browser rapid-input test |
| M-01 missing UUID / optional side effects | Guard UUID with a local-ID fallback, publish outcomes before persistence, isolate audio/storage failure | Compatibility tests; browser terminal handling with UUID absent and audio/storage throwing |
| M-02 mixed-case release | Physical `event.code` identity with normalized fallback; printed keys determine WASD direction | Mixed-case unit test and Shift/W browser test |
| M-03 shared input ownership | One ordered source map for keyboard keys and pointer IDs; last press wins, release restores remaining owner | Ownership unit tests; actual browser two-touch/keyboard interleaving |
| M-04 contrast / tiny text | New contrasting palette, supporting text at least 11px, clearer instructions | Computed-colour browser checks for hero, difficulty, HUD and score note; desktop/mobile visual review |
| M-05 touch comfort | 48px D-pad, 44px pause/fullscreen/setup/arena controls | Browser bounding-box checks through 320px width |
| M-06 narrow browser regression coverage | Add nine Playwright checks of the existing controller/UI | `npm run test:browser` |

These checks address the reported issues, not a complete accessibility or all-browser certification. Physical phones, Safari and Firefox are not tested here. Full audit still reports seven moderate development-only lint findings: the latest TypeScript ESLint package (8.72.2) depends on minimatch `^10.2.2`, while the advisory requires 11.0.1 or later. A compatible `npm audit fix` did not resolve them; production audit reports zero vulnerabilities. No forced lint downgrade or transitive major override was applied.

The original [audit backlog](audit/PRIORITISED_ISSUES.md) remains historical context. Broader balance, online scores, replay, Phaser lifecycle and future art/content work retain their own milestone reviews.
