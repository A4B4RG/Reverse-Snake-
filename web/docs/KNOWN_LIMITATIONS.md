# Known limitations

- Physical Android/iOS devices, Safari, Firefox and a complete screen-reader/WCAG audit are not verified by this run. Chrome viewport/touch emulation is identified separately.
- Headless Chrome keeps newly opened background pages visible in this environment. The genuine tab-switch test is explicitly skipped there; a separate blur-event wiring test verifies pause/resume. Real focus/visibility switching still needs a headed browser or physical-device session.
- Neural weights learn locally from successful human actions. Clearing site data removes learning; denied storage keeps it only for the current visit. Models do not sync across devices or promise continual improvement. Resizing may relocate actors to legal connected positions; very long Hunter bodies can be shortened if a smaller board cannot hold them.
- Local scores and replays belong to one browser and origin. Private browsing, clearing site data or denied storage may remove them. No cloud sync, online leaderboard or server score validation exists.
- Only three bounded completed replays are retained. The prior format-1 canopy-2 recordings remain supported; unknown game/rules versions are rejected; paused wall time, sound, render timing and generated record IDs/dates are outside deterministic guarantees. Over-limit rounds continue without retention. Ghost overlays are available for matching fruit-controlled modes only.
- Hunter and local Challenge are implemented, but genuine player balance feedback is pending. Challenges are fixed local practice, not server-issued competition. Adaptive opponents and flexible board sizes need genuine player balance feedback. Learned imitation is not guaranteed to improve every matchup.
- Phaser is not installed. Canvas remains the renderer. Editor, native Android packaging and online infrastructure are conditionally deferred; see TECHNICAL_DECISIONS.md.
- Keyboard labels, touch sizes, modal focus and sampled contrast are checked, but a realtime grid action game is not yet certified for nonvisual play. Dialogs may scroll internally at high zoom; the core layout is tested at specified viewport sizes.
- The Python/Kivy prototype and zero-byte native placeholders are retained history and have no reproducible supported desktop release.
- A project-wide licence has not been chosen by the owner. Third-party font/icon notices are retained.

Current local checks and the linked GitHub main workflow are recorded in VERIFICATION.md. Hosted browser verification remains NOT VERIFIED under the user's explicit waiver documented in RELEASE.md; source delivery does not certify the current production build. Future reproduced failures should be assessed against the exact affected build.
