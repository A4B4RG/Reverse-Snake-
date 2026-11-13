# Performance evidence

The production Canvas baseline was measured with REVERSE_SNAKE_BROWSER=chrome, node scripts/measure-performance.mjs against a built production server on port 599. Raw output: [performance-results.json](performance-results.json), timestamp 13 November 2026 22:31:46 UTC (14 November in India).

| Viewport | Sampled RAF frames / 5s | Median / p95 frame interval | Maximum interval | DOM loaded | First contentful paint |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 801 | 6.1 / 6.3 ms | 41.5 ms | 89.2 ms | 324 ms |
| 320 × 568 | 805 | 6.1 / 6.3 ms | 12.1 ms | 61.4 ms | 72 ms |

The measurement uses a five-second idle-mango run, including terminal rendering, in a local headless browser on this Windows host. RAF sample cadence is tied to this host/browser and is not a claim that Canvas paints every sample. Startup values are local and the second viewport may benefit from warm caches. This is not a physical-phone benchmark, sustained active-play certification, CPU/GPU profile or cloud-network startup guarantee.

Current design bounds: 400 logical cells, 20 ms simulation, paths only at planned lunges, capped six-cell boost trails, capped three-cell dash trails, a 200 ms catch-up clamp and an 80 ms React HUD cadence. Paused/unchanged worlds skip Canvas redraw. Animation frame listeners and audio are cleaned up on unmount. Replay retention is limited to three 250 KB records and 180,000 simulation steps; an over-limit game continues without recording.

Phaser is deferred pending evidence of a concrete scene/rendering requirement or measured bottleneck. A migration must retain pure rules, compare identical states, measure bundle/frame costs and preserve Canvas fallback until parity. Merely installing Phaser does not establish a performance benefit.
