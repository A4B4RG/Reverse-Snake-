# Security review

The current app has no accounts, database, write API, telemetry or remote score submission. Local scores and replays are editable browser data and are presented as local practice records. There is no claim of anti-cheat or server verification.

The full dependency audit reported zero vulnerabilities after the scoped minimatch 11.0.1 override beneath TypeScript ESLint's parser. The lockfile was clean-installed; the parser's named minimatch API, tests and lint were exercised. Refresh npm audit --audit-level=moderate before each release. Historical seven moderate lint findings are superseded by this check, rather than suppressed.

Existing saves tolerate absent, corrupt and blocked storage. New replay reads bound raw size, versions, mode, arena, difficulty, seed, commands, step count and final fingerprint fields. Only recognized challenges match their frozen config. No uploaded executable content or unsafe HTML is needed. Replay fingerprint detects accidental divergence; it is not a cryptographic signature.

Environment files are ignored. Review staged paths and scan source/generated bundles for accidental credentials before delivery. This is a targeted repository review, not a penetration test or complete dependency-supply-chain audit. No licence, purchase, account policy or legal terms were accepted for the owner.

Source search found no unsafe HTML/eval or credential-pattern matches, and no tracked environment/secret files were identified. New mode record metadata is validated as well as replay metadata. npm still warns that ESLint 9 is outside its upstream support window and that esbuild has an uncovered install-script policy entry on this host; the existing compatible lint/build/tests executed successfully. These notices are retained for maintenance rather than hidden by a forced broad upgrade.
