# Feedback register

| Report | Classification | Evidence / resolution |
| --- | --- | --- |
| Snake repeatedly resets after hitting Wild Heart wall and follows the old route | Gameplay defect | Original Survival fix committed at 1a4c040. Root-wall, replacement target, lunge corner and commitment regressions retained. |
| Wild Heart Levels wins without moving | Gameplay defect | Reproduced on Easy/Normal/Hard; previous routing was Survival-only. Extended distances/corner planning to Levels; all 30 idle-start cases require capture. Browser and hosted release checks recorded separately. |
| Whole screen should fit one viewport | UI/UX issue | Baseline 1920 × 1080 document was 1,432 px tall. Viewport allocation and menu implemented; 12 initial size checks pass. |
| Preserve progress reports; use the uploaded complete-build document for scope | Documentation requirement | Root snapshot preserved and linked to CURRENT_STATE.md. Historical migration/audit proposals retain their dates and a current-decision pointer. |
| Push all work to GitHub main | Delivery requirement | Candidate verification and exact main/production evidence tracked in RELEASE.md. |

No external player session or additional balance preference was invented. Future reports should include build URL, SHA, mode, arena, difficulty, browser/device/viewport, repeat frequency and steps. Classify controls, visuals/audio, performance, accessibility, compatibility, balance preference and feature requests separately from reproduced defects. Record expected/actual behavior before attributing a root cause.
