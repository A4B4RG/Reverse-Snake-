# Verification

## Step 2 add-ons — jungle and close-call boosts

Verified on 11 November 2026 with Node.js 24.19.0, npm 11.17.0 and installed desktop Chrome through Playwright.

- **Clean lockfile installation passed:** `npm ci`, followed by the full rules, lint, build, TypeScript and browser checks.

- **29 rules/compatibility tests passed:** the original collision, arena, chase, dash, hunger and storage coverage plus fixed movement budgets, buffered taps, idle timing, 2s/5s close-call durations, refresh without cooldown, exact sustained 2× speed, expiry, pause/restart, rejected false close calls, safe dash boosts, endless survival, clear respawns, input ownership, absent/throwing UUID, legacy saves and throwing audio.
- **Nine production-browser regressions passed:** rapid taps; Shift/W release; pause/resume ownership; two actual touch contacts interleaved with a held key; a real close-call chase in each mode; optional API failures and restart; survival save/reload; reduced motion; supporting-text contrast and 44px-or-larger frequent controls.
- **Production build, ESLint and TypeScript passed.** Playwright starts/stops a loopback production server at port 599. Browser tests control time and inspect the rendered mango's pixels rather than exposing or mutating simulation state.
- **Visual review:** desktop and mobile jungle artwork and a live close-call effect were inspected. Widths 1440, 900, 640, 390 and 320 were checked without horizontal overflow. The sampled hero, difficulty, HUD and score-note text/background pairs exceed 4.5:1. This is targeted issue verification, not a full WCAG audit.
- **Graphics feedback received:** the user selected dark teal Deep canopy with an amber patterned snake, golden mango and turquoise leaf effects before implementation. See [Step 2 add-ons](STEP_2_ADDONS.md) for the rules and issue-resolution mapping.
- **Dependency audit:** production dependencies have zero vulnerabilities. Seven moderate development-only lint findings remain. A compatible `npm audit fix` did not resolve them; the latest TypeScript ESLint package still requires minimatch 10, while the reported fix requires 11.0.1+. No forced major override or downgrade was applied.
- **Limits:** desktop Chrome and emulated multi-touch/viewports were tested; physical phones, Safari and Firefox remain untested. Phaser migration remains a separate milestone.

Current screenshots: [desktop](screenshots/jungle-desktop.png), [mobile](screenshots/jungle-mobile.png), [Levels boost](screenshots/jungle-levels-boost.png), [Survival boost](screenshots/jungle-survival-boost.png). Earlier verification below describes the historical builds.

## Vercel deployment preparation

Verified on November 11, 2026, using Node.js 24.19.0 and npm 11.17.0.

- **Clean dependency installation passed:** `npm ci` installed the committed lockfile without changing dependency versions.
- **All 13 existing game tests passed.** ESLint, the Next.js production build, and the separate TypeScript check also passed.
- **Deployment configuration checked:** all fields used in `vercel.json` match their definitions in Vercel's official JSON schema. `package.json` and `package-lock.json` both select Node.js `24.x`.
- **Production HTTP smoke check passed:** the built game returned HTTP 200, as did all nine linked script/style/icon assets and all five bundled fonts. An unknown route returned HTTP 404. The temporary loopback-only production server was stopped after verification.
- **Production dependency audit passed:** `npm audit --omit=dev` reported zero vulnerabilities.
- **Manual deployment instructions:** [DEPLOYMENT.md](../DEPLOYMENT.md). Import the repository in Vercel, select Root Directory `web`, use Next.js and Node.js `24.x`, and keep the default output directory. No environment variables are required.

These checks cover deployment preparation for the current browser game. No Vercel deployment or new interactive browser playthrough was performed during this preparation.

## Earlier browser verification

Verified on November 4, 2026.

- **13 automated tests passed**: all five arena spawns; paused/ready/end-state immobility; stationary-food pursuit on all difficulties; real wall-bait victory; wall, obstacle and body collisions; departing-tail legality; dash collision and recharge; hunger and survival victory; restart; immediate keyboard/touch movement; save round trips and malformed/unavailable storage.
- **TypeScript, ESLint, and the Next.js production build passed.**
- **Production server:** `http://localhost:3000` returned HTTP 200. The server was started as a hidden background Node process; its PID is stored in `web/.server.pid` and output in `web/server.log` and `web/server-error.log`.
- **Browser playthrough:** keyboard input, dash, pause/resume, a loss and retry, touch movement, an actual wall-bait win (1,539 points), next-arena selection, instructions, saved run history, reload persistence, and clearing the three test runs were verified.
- **Responsive checks:** normal in-app browser width, 1440×1000 desktop, and 390×844 mobile. No mobile horizontal overflow. Touch controls and layout verified; the temporary viewport override was reset after testing.
- **Browser console:** no application warnings or errors during final verification.
- **Dependency audit:** no production dependency vulnerabilities reported by `npm audit --omit=dev`. The full audit reports a moderate `minimatch` advisory propagated through development-only lint dependencies; fixing it with the registry's suggested downgrade would break the current Next.js lint setup, so it was not forced.

Screenshots are saved in `docs/screenshots/`. Test scores were cleared, and the browser was left on the ready screen for The Garden with Normal difficulty.
