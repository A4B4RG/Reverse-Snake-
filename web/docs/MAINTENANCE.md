# Maintenance and release operations

Use Node 24 and the committed web/package-lock.json. From web/: npm ci; npm audit --audit-level=moderate; npm test; npm run lint; npm run build; npm run typecheck; install Playwright Chromium if needed; npm run test:browser. Hosted checks set REVERSE_SNAKE_BASE_URL to the actual HTTPS deployment and skip the local server. Installed Chrome can be selected with REVERSE_SNAKE_BROWSER=chrome.

.github/workflows/verify.yml runs these checks on main, candidate codex branches and pull requests. It uses read-only repository permissions and no application secrets. Its first remote result must be recorded in RELEASE.md.

Changes to mango rules require reproducing the issue and retaining the all-arena idle-start, lunge, tail, collision, dash and save regressions. A rule change requires a new replay ruleset/version; unsupported replays are ignored safely. New-mode records stay separate from the old mango saves. Replays and extra-mode records are bounded and tolerate storage failure.

The browser server uses loopback port 599 locally and 1599 when CI is set. Unix CI cannot bind ports below 1024 as an unprivileged runner; do not resolve this by granting elevated permissions. Hosted base URLs skip the server entirely.

Five generated screens/__pycache__ files were removed only from Git's index. Their original files remain locally, and the root ignore rules prevent recommitting bytecode. main.py, screens/ and confirmed empty cpp/native placeholders are preserved as historical reference; do not mistake them for production AI or repair them as browser work.

Deploy through the existing Vercel project rooted at web/. Verify the candidate Preview, remote CI and exact SHA before main. See DEPLOYMENT.md and RELEASE.md for release and rollback evidence. Asset notices accompany source; a project-wide licence remains an owner decision.
