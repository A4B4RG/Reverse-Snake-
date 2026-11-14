# Online PvP proposal

A custom domain is optional. The current `reverse-snake-chi.vercel.app` frontend can stay on Vercel, and players can use that address for multiplayer. A domain later provides a shorter branded address; it does not supply multiplayer infrastructure. This document is a proposal, not implemented online behavior.

## First multiplayer mode

Start with private two-player rooms: one player controls the fruit, the other controls the snake. Use a shared map, seed, board size and rules version, with a clear round goal, countdown, rematch and disconnect outcome. Choose one canonical board geometry for both players so a phone and desktop have the same collision world; render that world responsively rather than independently resizing the online simulation.

A first prototype can use guest identities and invitation codes. Public matchmaking, accounts, rankings and reconnecting across devices can follow once latency and balance are tested. Pause needs agreed server rules; one client's local menu must not silently pause an opponent's match.

## Infrastructure

| Part | Responsibility |
| --- | --- |
| Existing Vercel frontend | UI, touch/keyboard input, rendering, lobby and results |
| Realtime match service | Secure WebSocket connections, room membership, authoritative fixed-step simulation and round outcomes |
| Database, when durable features are needed | Account/profile data, completed matches, rankings and moderation records |
| Identity | Guest sessions initially; authenticated accounts for durable personal progress |
| Operations | Health checks, logs, connection limits, monitoring and capacity based on concurrent matches |

Run the match service on a host or managed realtime game platform designed for long-lived WebSocket connections. The current static browser-only deployment has no such process. Ordinary Vercel Functions do not act as a persistent WebSocket match server; keep frontend hosting there and add a separate service suited to live matches.

The existing pure TypeScript simulation and fixed steps provide a useful starting point. The server decides legal turns, dash cooldown, collisions, score and win/loss. Clients send ordered inputs rather than trusted positions or scores. Broadcast snapshots/ticks and input acknowledgements; clients interpolate movement and can predict their own motion with reconciliation. Test latency, jitter, stale messages and disconnects before publishing competitive results. Online neural behavior should use controlled rules; local browser models must not change a human opponent's authoritative world.

Use HTTPS/WSS, short-lived room/session authorization, origin checks, bounded/rate-limited messages and server-validated membership. Store durable results from the match service. Private-room play can begin without an account database; rankings and cross-device progress require durable storage and identity.

## Delivery sequence

1. Define PvP roles, map dimensions, win conditions and disconnect/pause rules.
2. Build an authoritative room server and connect two local clients.
3. Add invite/join, countdown, synchronized input, results and rematch.
4. Test desktop/phone interoperability under simulated latency and on physical devices.
5. Deploy the match service, configure its WSS endpoint in the Vercel frontend, and verify the actual hosted two-player flow.
6. Add accounts, durable rankings and matchmaking when required.

No domain purchase is needed for those steps. Hosting cost depends mainly on active connections, simulation load, region and database usage; establish expected simultaneous matches before selecting a plan. The current offline modes and local saves can continue alongside PvP.
