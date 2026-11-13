# Current browser product

Updated 14 November 2026. This report supplements the preserved root PROJECT_STATUS.md snapshot; it is a status report, not the completion specification.

The browser product in web/ remains authoritative. Levels and Survival retain five arenas, three difficulties, 20 ms rules, score formulas, dash, close-call boosts, input ownership and backward-compatible local scores. The reported idle Wild Heart Levels win is corrected: both modes plan obstacle/body-aware routes while a lunge already underway remains committed. The original Survival crash/respawn fix remains covered.

Version 1.1.0 adds /hunter (player snake), /challenge (three fixed local survival courses), /replays (completed-run playback), optional matching mango ghosts, a menu that remains accessible on phones, and a board that sizes to the remaining viewport. The main layout has passed twelve viewport checks, including 320 × 568 and 844 × 390. New modes have separate score storage; the existing reverse-snake:v1 key is unchanged. See [mode contracts](NEW_MODES.md).

The maintained stack is Next.js 16.4.5, React 19.3.1, TypeScript, Node 24 and Canvas. Phaser, online accounts, cloud scores, custom arena editor, Android package and ML are not implemented. Their conditional deferral is explained in [technical decisions](TECHNICAL_DECISIONS.md).

Final local verification: clean npm ci, 44 rules tests, ESLint, full audit (zero vulnerabilities), production build and TypeScript all pass. The full browser suite has 34 passes and one explicit headless tab-visibility skip; it covers new modes, replay/ghost, native fullscreen, dialog focus, navigation, offline loaded gameplay and twelve viewport sizes. The startup first-frame reset and dialog focus-return regressions found during testing are also fixed. [Performance evidence](PERFORMANCE.md) contains executed measurements.

Source release revision is 57e038f00c2959a3d2af0025c154383f7e01732d. Candidate branch codex/complete-browser-release is being prepared with all reports and CI for the requested main delivery. At the last remote inspection, production remained at 1a4c040d7057f4c9546c5f67f9596098f6437d31 on https://reverse-snake-chi.vercel.app. Hosted verification is blocked by the browser origin approval denial for vercel.com; [RELEASE.md](RELEASE.md) records the precise delivery state. No updated production claim is made.

Git repository: https://github.com/A4B4RG/Reverse-Snake-. Source and documentation are being prepared for the requested main release. Generated Python bytecode was removed from the Git index and remains on disk. The legacy Python and empty native placeholders remain historical reference; they are not part of browser delivery.

Physical devices, external player sessions, Safari and Firefox remain unverified. [Known limitations](KNOWN_LIMITATIONS.md) describes these gaps. [Prioritised work](PRIORITISED_WORK.md) identifies remaining release work.
