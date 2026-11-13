# Release evidence

Candidate release 1.1.0 is prepared on 14 November 2026 on codex/complete-browser-release. Source revision: 57e038f00c2959a3d2af0025c154383f7e01732d, preceded by a746e8b (Wild Heart Levels fix and bytecode untracking). Documentation/CI commits follow without changing the verified gameplay.

Local checks: clean install, 44 rules tests, lint, zero-findings full audit, build, types and 34 browser tests PASS. One real-tab headless check is explicitly skipped; the event wiring test passes. Production Canvas measurement executed and raw results are committed with this report. Screenshots were reviewed at desktop and mobile sizes.

Hosted verification gap: the Browser Use origin approval gate rejected opening the existing Vercel deployment at vercel.com and reported that the user declined access. No alternate browser or indirect access to that blocked destination was attempted. The user then explicitly instructed: **"Push main; document hosted verification gap."** Main delivery proceeds under that instruction after CI; actual Preview and production browser verification remain NOT VERIFIED.

Candidate 9901fe1ca5c7472fcedb38800a4398b3ce2fd0ab was pushed to GitHub. [First CI run](https://github.com/A4B4RG/Reverse-Snake-/actions/runs/43520399376) passed clean install, audit, 44 rules tests, lint, build and types, but its browser server could not bind Unix privileged port 599 (EACCES). Playwright now uses unprivileged port 1599 in CI and retains 599 for ordinary local runs. The corrected remote run is recorded after completion.

Baseline / rollback checkpoint: 1a4c040d7057f4c9546c5f67f9596098f6437d31, Fix Survival hunter routing after wall crashes. Existing Vercel success URL: https://vercel.com/anuragghosh1227-8636s-projects/reverse-snake/8zxLAsEqgvbJ84uzsXM2NuQn4voA. Existing production: https://reverse-snake-chi.vercel.app. Repository: https://github.com/A4B4RG/Reverse-Snake-.

Delivery procedure: build/test candidate, push a codex branch, observe real GitHub/Vercel status, verify the actual HTTPS Preview (modes, input, results, assets, console, viewport), fast-forward verified code onto main, observe production deployment, then verify production. Do not invent a Preview URL or treat a dashboard success as a browser check.

Rollback: in the existing Vercel project's deployment history, promote the known-good deployment if necessary. For a source rollback, use a reviewed git revert on main and let integration deploy it; retain history and avoid reset/force-push. A source rollback does not restore deleted browser-local data. Replays reject incompatible versions safely. No environment variable, database migration or external persistent data is required by this release.
