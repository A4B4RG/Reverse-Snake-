# Performance evidence

Version 1.2.0's local production build was sampled on 14 November 2026 at 04:41:18 UTC with `REVERSE_SNAKE_BROWSER=chrome` and `node scripts/measure-performance.mjs http://127.0.0.1:1599`. Raw data: [performance-results.json](performance-results.json).

| Viewport | Sampled RAF frames / 5s | Median / p95 interval | Maximum interval | DOM loaded | First contentful paint |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 818 | 6.1 / 6.2 ms | 30.3 ms | 51.6 ms | 304 ms |
| 320 × 568 | 826 | 6.1 / 6.2 ms | 8.1 ms | 20.5 ms | 64 ms |

This is a five-second idle-fruit chase on this Windows/headless Chrome host, including terminal rendering. RAF cadence is host-dependent and does not claim Canvas redraw on every sample. Local startup and warmed caches do not predict hosted-network startup. The sample is not a sustained human-learning workload, physical-phone benchmark or CPU/GPU profile. Behavior/inference correctness is covered by separate tests.

Board geometry is derived from the viewport and bounded to 12–96 cells per axis; the active map is no longer a fixed 400-cell square. Routing is bounded by board area and runs at planned lunges. Each neural policy has 14 inputs, 12 hidden units and four outputs. Actual human movement triggers its training; persisted models are saved periodically and on pause/outcome/navigation. Trails remain capped, fixed simulation steps are 20 ms, catch-up is clamped at 200 ms and React's HUD is throttled to 80 ms. Canvas skips unchanged visual states. The paused background advances a separate replay cursor without live training or scoring. Timers/listeners/Canvas observers/audio are cleaned up on unmount.

Three completed replays are bounded to 250 KB each and 180,000 steps. The separate unscored preview is also bounded. Score entries omit neural snapshots. No TensorFlow, remote inference or new runtime dependency is introduced.

Phaser remains a separate migration decision requiring a concrete scene/rendering benefit and measured parity against the pure rules. The current evidence establishes local behavior only; external player balance and real-device performance remain future validation.
