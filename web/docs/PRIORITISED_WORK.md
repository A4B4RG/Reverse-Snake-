# Prioritised product work

The complete-build specification supplied on 14 November governs scope. Existing status reports and migration proposals describe earlier states.

| Priority | Work | State and completion evidence |
| --- | --- | --- |
| Delivered | Wild Heart Levels idle-start defect | Fixed; all 30 idle rules cases and three real browser difficulty regressions pass. Hosted check waived by the user. |
| Delivered | Single viewport | Final main-layout checks pass at 12 viewport sizes; Hunter/Challenge phone and short-landscape checks also pass. |
| Delivered | Hunter / local Challenge / replay | Implemented behind separate routes; rules, storage, replay/ghost and browser checks pass. |
| Delivered | Security / generated caches / CI | Zero full audit findings; bytecode untracked and preserved. Real Linux GitHub CI passes after correcting the privileged test port. |
| Delivery gap | Preview and production | Main pushed and verified. User explicitly waived hosted verification after browser access denial; rollback is documented. Actual hosted gameplay remains NOT VERIFIED. |
| Quality | Accessibility and lifecycle | Keyboard labels, native modal focus, touch sizes and targeted contrast checked. Expand navigation, fullscreen and suspension checks. Full screen-reader audit pending. |
| Measured | Performance | Production Canvas measurements and raw JSON recorded; physical-device/long-session profiling remains future validation. |
| External | Human balance and physical-device validation | Checklist prepared. No invented tester or phone results; pending genuine access. |
| Conditional | Phaser / online / editor / Android / ML | Deferred for the concrete reasons in TECHNICAL_DECISIONS.md. No speculative infrastructure. |

Do not tune the established mango score, speed, lunge or arena rules from a single unverified preference. New mode balance remains a subject for the prepared controlled playtest.
