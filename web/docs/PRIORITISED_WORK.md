# Prioritised product work

The complete-build specification supplied on 14 November governs scope. Existing status reports and migration proposals describe earlier states.

| Priority | Work | State and completion evidence |
| --- | --- | --- |
| Release | Wild Heart Levels idle-start defect | Fixed; all 30 mode/arena/difficulty idle cases pass. Production browser and hosted regression required. |
| Release | Single viewport | Implemented; 12 initial main-layout checks pass. Recheck after final styling and on hosted build. |
| Release | Hunter / local Challenge / replay | Implemented behind separate routes; rules and compatibility tests pass. Browser verification underway. |
| Release | Security / generated caches / CI | Full npm audit zero findings; scoped lint override installed. Bytecode untracked and preserved. Workflow awaits actual GitHub execution. |
| Release | Preview, production and rollback | Existing Vercel project retained; exact candidate Preview and production checks pending. |
| Quality | Accessibility and lifecycle | Keyboard labels, native modal focus, touch sizes and targeted contrast checked. Expand navigation, fullscreen and suspension checks. Full screen-reader audit pending. |
| Quality | Performance | Measure production Canvas and record results before considering a renderer change. |
| External | Human balance and physical-device validation | Checklist prepared. No invented tester or phone results; pending genuine access. |
| Conditional | Phaser / online / editor / Android / ML | Deferred for the concrete reasons in TECHNICAL_DECISIONS.md. No speculative infrastructure. |

Do not tune the established mango score, speed, lunge or arena rules from a single unverified preference. New mode balance remains a subject for the prepared controlled playtest.
