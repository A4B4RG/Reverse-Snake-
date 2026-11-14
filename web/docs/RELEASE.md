# Release evidence

## Maps and mobile controls release 1.3.0 — 14 November 2026

Ten maps now provide increasing Levels score targets and saved sequential unlocks. Levels points come from moved cells, so idle/blocked play cannot unlock a map; crashed hunters respawn until the objective is met. Complex wall footprints retain density as fullscreen adds cells. Named Food character / Snake design dropdowns appear once in Menu and persist across rounds/modes. Compact layouts put setup in Menu and leave most space for the board. Swipes steer in their matching direction, double-tap after a swipe dashes in the last direction, and on-screen arrow/Dash buttons are removed. Desktop keyboard controls remain.

New orchard-4 recordings retain orchard-3 and canopy-2 replay compatibility with their original rules and terrain. Current product/mode/visual reports, screenshots and ONLINE_PVP.md accompany the release; historical PROJECT_STATUS.md remains preserved. PvP is a proposal: keep the Vercel frontend address, add a realtime authoritative match service, and optionally add a domain later.

Local checks: **59 rules tests**, build, lint, types, zero-findings audit, and all **55 runnable browser cases** verified across the full run and the corrected six-case rerun. One existing headless visibility skip remains; VERIFICATION.md explains the border-width assertion correction. No dependency versions changed.

Repository: https://github.com/A4B4RG/Reverse-Snake-, branch **main**. Pre-update rollback checkpoint: `0a6c35e9118613e6fca67a14e5b86d76ac646ada`. Source, tests, reports and current captures are delivered through the existing main integration. The [main workflow](https://github.com/A4B4RG/Reverse-Snake-/actions/workflows/verify.yml?query=branch%3Amain) identifies each exact pushed revision and its clean-install/Linux verification.

Hosted Preview/production gameplay remains **NOT VERIFIED** under the explicit instruction **“Push main; document hosted verification gap.”** The declined access is not bypassed. Source push/CI does not establish the deployed version at https://reverse-snake-chi.vercel.app. Roll back source with a reviewed revert using the existing project; no force-push or backend migration is needed. Reverting source does not restore cleared local saves.

The sections below preserve earlier release evidence.

## Controls beneath the map — 14 November 2026

“A few handy moves” now sits directly below the desktop game frame in a compact panel of matching width. The sidebar contains setup, and the “Outsmart the hunter” heading, fruit ornament and padding are smaller. Responsive touch layouts and the flexible fullscreen board are retained. Build, lint, types and 21 targeted browser checks pass; updated screenshots and current product reports accompany the change. This update builds on main `91d55fb752a9c904c72516d9deaf751d7e644754`. Main delivery remains authorized; hosted Preview/production verification remains NOT VERIFIED under the existing user waiver.

## Adaptive browser release 1.2.0 — 14 November 2026

This release replaces the fixed square playfield with full outer-rectangle geometry and a larger fullscreen board, adds local trainable fruit/snake opponents, bottom-aligned desktop controls, full fruit ghosts at 32% opacity, independent recorded gameplay behind translucent blurred pause, and five fruit/four snake appearances selected before matches. Apple/Jade are the fresh defaults; the presentation is fruit-neutral. Old scores and canopy-2 replay playback are retained. New recordings capture geometry, cosmetics, initial neural snapshots and resize commands.

Local production checks pass: **54 rules tests**, **53 browser passes** and one existing explicit headless visibility skip, lint, build, typecheck and zero-findings full audit. Final captures and production measurements accompany this release. See VERIFICATION.md for the coverage and PERFORMANCE.md for the measured limits.

Repository: https://github.com/A4B4RG/Reverse-Snake-, branch **main**. Pre-update rollback checkpoint: `1d6eaaee31140e078e06cd736ca552c4e2435e9a`. This delivery includes the complete source/tests, current scenario reports, evidence/screenshots and preserved root PROJECT_STATUS.md. The [main verification workflow](https://github.com/A4B4RG/Reverse-Snake-/actions/workflows/verify.yml?query=branch%3Amain) identifies the exact pushed source and its clean-install/Linux checks.

The user previously authorized pushing all work to GitHub main and explicitly instructed **“Push main; document hosted verification gap.”** Updated Vercel Preview/production browser gameplay remains **NOT VERIFIED**. The earlier denied access was not bypassed. A main push or CI success does not establish the deployment currently served by https://reverse-snake-chi.vercel.app. Use the existing integration and a reviewed revert to the checkpoint for source rollback; no force-push, backend migration or replacement hosting project is required. A revert does not restore cleared browser-local learning, scores or replays.

The sections below preserve earlier release evidence.

## Mango presentation cleanup — 14 November 2026

The main Mango board omits the tracking badge, vertical side slogans and bottom status/arena footer. Mode/difficulty captions are removed, dash readiness is concise, and the sticker uses smaller bounded text. Current screenshots and product/visual reports include the updated layout.

**Main delivery verified:** source 39a182cda000c3d9b9269344377ca602647130c3 is pushed. [CI run 43543570214](https://github.com/A4B4RG/Reverse-Snake-/actions/runs/43543570214) passes in 1m47s: clean install, zero-findings audit, 44 rules tests, lint, build, TypeScript and 44 browser passes with one existing headless visibility skip. This evidence update follows the verified source commit. Hosted verification remains NOT VERIFIED under the existing user waiver.

## Click menu and alternate mode links — 14 November 2026

Menu now toggles through click/tap or keyboard activation; hovering leaves gameplay running. The Mango page offers the Hunter link and the Hunter page offers the Mango link, omitting their own mode from those two options. Light/dark settings and the other menu actions remain available. Local lint, production build, TypeScript and the full browser suite pass: 44 browser passes and one existing headless visibility skip. This update builds on main e6d7fdd813f476fa3723e5d4315c93c34ba4d8b6. Main delivery remains authorized and hosted verification remains NOT VERIFIED under the existing user waiver.

**Main delivery verified:** source 6cacab4024d89024ea1bd4a4dc77e7889e87af0d is pushed. [CI run 43539241424](https://github.com/A4B4RG/Reverse-Snake-/actions/runs/43539241424) passes in 2m2s: clean install, zero-findings audit, 44 rules tests, lint, build, TypeScript and 44 browser passes with one existing headless visibility skip. This evidence update follows the verified source commit.

## Theme and hover-menu update — 14 November 2026

The current source adds default light and saved original dark palettes, a shared Theme menu across all modes/replay, mouse hover opening and touch/click toggling. The update is based on main cb933bf005fc0b8e4e8c4d53f10fd307e260ab11. Local verification passes 44 rules tests, lint, production build, TypeScript and 43 browser tests, with one existing headless tab-visibility skip. Updated visual captures and current product/verification reports accompany the source.

**Main delivery verified:** implementation 36011f742bee65e0a8336604c6ec6d39a4983168 and the browser-test timing correction at 36668b39f7d41b46fa12aa8d50aade06d24736c2 are pushed to GitHub main. [CI run 43536871523](https://github.com/A4B4RG/Reverse-Snake-/actions/runs/43536871523) passes in 1m50s: clean install, dependency audit, 44 rules tests, lint, build, typecheck and 43 browser passes with one existing headless visibility skip. This evidence update follows those source/test commits.

Hosted Preview/production verification remains NOT VERIFIED under the existing explicit waiver below; refreshing the site only shows the update after Vercel has successfully deployed the new main commit. A GitHub push does not establish that deployed state.

## Earlier complete-browser release

Candidate release 1.1.0 is prepared on 14 November 2026 on codex/complete-browser-release. Source revision: 57e038f00c2959a3d2af0025c154383f7e01732d, preceded by a746e8b (Wild Heart Levels fix and bytecode untracking). Documentation/CI commits follow without changing the verified gameplay.

Local checks: clean install, 44 rules tests, lint, zero-findings full audit, build, types and 34 browser tests PASS. One real-tab headless check is explicitly skipped; the event wiring test passes. Production Canvas measurement executed and raw results are committed with this report. Screenshots were reviewed at desktop and mobile sizes.

Hosted verification gap: the Browser Use origin approval gate rejected opening the existing Vercel deployment at vercel.com and reported that the user declined access. No alternate browser or indirect access to that blocked destination was attempted. The user then explicitly instructed: **"Push main; document hosted verification gap."** Main delivery proceeds under that instruction after CI; actual Preview and production browser verification remain NOT VERIFIED.

Candidate 9901fe1ca5c7472fcedb38800a4398b3ce2fd0ab was pushed to GitHub. [First CI run](https://github.com/A4B4RG/Reverse-Snake-/actions/runs/43520399376) passed clean install, audit, 44 rules tests, lint, build and types, but its browser server could not bind Unix privileged port 599 (EACCES). Playwright now uses unprivileged port 1599 in CI and retains 599 for ordinary local runs. The corrected remote run is recorded after completion.

**GitHub delivery verified:** main was fast-forwarded and pushed at 57a1977cb0b883dccf057df852f5a42d95103273; the GitHub commits/main API confirmed that exact SHA. All code, tests, asset notices, status reports and CI are included. This release-evidence documentation update follows the source release without changing gameplay.

[Corrected candidate CI](https://github.com/A4B4RG/Reverse-Snake-/actions/runs/43520881817) **PASS**, 1m49s: clean install, full audit (zero findings), 44 rules tests, lint, production build, typecheck, browser installation, **34 browser passes and one headless visibility skip**. Hosted Preview/production checks remain NOT VERIFIED under the user's explicit release waiver. The existing integration may build main; a GitHub push alone is not proof of deployed gameplay.

Baseline / rollback checkpoint: 1a4c040d7057f4c9546c5f67f9596098f6437d31, Fix Survival hunter routing after wall crashes. Existing Vercel success URL: https://vercel.com/anuragghosh1227-8636s-projects/reverse-snake/8zxLAsEqgvbJ84uzsXM2NuQn4voA. Existing production: https://reverse-snake-chi.vercel.app. Repository: https://github.com/A4B4RG/Reverse-Snake-.

Delivery procedure: build/test candidate, push a codex branch, observe real GitHub/Vercel status, verify the actual HTTPS Preview (modes, input, results, assets, console, viewport), fast-forward verified code onto main, observe production deployment, then verify production. Do not invent a Preview URL or treat a dashboard success as a browser check.

Rollback: in the existing Vercel project's deployment history, promote the known-good deployment if necessary. For a source rollback, use a reviewed git revert on main and let integration deploy it; retain history and avoid reset/force-push. A source rollback does not restore deleted browser-local data. Replays reject incompatible versions safely. No environment variable, database migration or external persistent data is required by this release.
