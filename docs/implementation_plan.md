# GraffitiWalL Activation Implementation Plan

## 1. Vision & Experience Summary
- **Objective:** Allow event visitors to draw collaboratively on a large video wall by scanning a QR code with their phones. The wall renders everyone’s strokes in real time and automatically fades content that is older than a configurable window (e.g., 5 minutes).
- **Key Interactions:**
  1. Visitor scans QR code that opens the mobile web controller.
  2. User selects tool (spray, brush, marker, eraser) and thickness/color.
  3. User draws on phone canvas; strokes immediately appear on the wall.
  4. Strokes older than the defined lifespan disappear smoothly, ensuring the canvas constantly refreshes.

## 2. High-Level Architecture
```
+-------------+      WebSocket       +----------------------+      HDMI/Display      +------------------+
| Mobile Web  | <------------------> | Real-time Gateway    | <--------------------> | Video Wall App   |
| Controllers |                      | (Node.js/Socket.IO)  |                      | (Three.js/Canvas) |
+-------------+                      +----------------------+                      +------------------+
         ^                                  ^        ^
         |                                  |        |
         |     REST for onboarding          |        | Webhooks/Timers
         |                                  |        |
         +--------------------------+       |        +----------------+
                                    |       |                         |
                              +-----+-------+----+          +--------+--------+
                              | Session & State |          | Admin & Metrics |
                              | (Redis / Postgres) |        | Dashboard        |
                              +-------------------+        +------------------+
```

### Components
1. **Mobile Controller Web App** (React/Vite or Next.js, responsive for smartphones)
   - Canvas drawing (e.g., using `fabric.js`, `paper.js`, or custom HTML5 Canvas).
   - Tool palette, thickness, opacity controls.
   - Displays current mode, stroke color, connection status.

2. **Real-time Gateway** (Node.js with Socket.IO or NestJS + WebSockets)
   - Manages socket rooms per screen/activation.
   - Receives stroke data from controllers; broadcasts to wall and other viewers.
   - Enforces rate limits, handles reconnects, and cleans up stale clients.

3. **State Store**
   - **Redis** for in-memory stroke buffer with TTL to auto-expire entries.
   - Optionally Postgres for analytics/audit if you need persistence beyond the 5-minute window.

4. **Video Wall Renderer** (Electron app or full-screen browser)
   - Consumes WebSocket stream and renders strokes in real time.
   - Applies smoothing and fade-out animations when TTL expires.
   - Optimized rendering with WebGL/Three.js or 2D Canvas depending on design (e.g., neon graffiti effects).

5. **Admin Dashboard (optional)**
   - Set stroke lifespan, palette, moderation controls (clear canvas, ban user).
   - Metrics: active users, stroke rate, latency.

## 3. Data Model & Message Flow
- **Stroke Payload Example:**
```json
{
  "sessionId": "abc123",
  "userId": "u-45",
  "tool": "spray",
  "color": "#FF00AA",
  "thickness": 12,
  "points": [[10, 30], [14, 35], ...],
  "timestamp": 1717321200000
}
```
- **Workflow:**
  1. User draws → controller batches points (e.g., 10–20ms interval) and emits `stroke:update` events.
  2. Gateway tags event with server timestamp, pushes to Redis sorted set (score = timestamp).
  3. Gateway broadcasts to wall clients instantly.
  4. Background job (or Redis key expiration) removes strokes older than TTL; gateway sends `stroke:remove` event so wall can fade them out.

## 4. Handling Stroke Lifespan
- Use Redis Sorted Set keyed by session: `strokes:<sessionId>`.
- Each entry stores serialized stroke with timestamp.
- Cron job runs every few seconds to prune strokes older than TTL and emits removal events.
- Wall app listens for `stroke:remove` and runs fade animation before clearing.
- Alternative: set per-stroke TTL using Redis Streams with consumer group that triggers on expiration.

## 5. User Onboarding via QR Code
1. Generate unique activation URL per wall (e.g., `https://graffitiwall.app/session/{id}`).
2. Print QR codes near the installation.
3. On first load:
   - Request camera permission? (Only if you want photo integration.)
   - Ask for nickname or auto-assign alias.
   - Establish WebSocket connection, show loading animation until handshake completes.

## 6. Tooling & UX Considerations
- **Tool Picker:** radial menu or bottom toolbar with icons (spray, brush, marker, eraser).
- **Color Palette:** curated set to avoid visual clutter; optionally allow gradients.
- **Pressure Simulation:** mimic spray effect via random scatter particles around main stroke.
- **Undo/Clear:** allow undo last stroke locally before sending; server can maintain limited undo per user.
- **Latency Feedback:** show connection quality (green/yellow/red) to reassure participants.

## 7. Multi-user Collision & Performance
- Coalesce drawing points on the controller to reduce events (use interpolation on wall to smooth).
- Limit simultaneous strokes per user to avoid flooding.
- Implement server-side throttling (max 60 events/sec per socket).
- Use requestAnimationFrame on wall renderer to batch draw operations.

## 8. Hardware & Deployment
- **Video Wall:**
  - Use a PC with GPU (e.g., Nvidia RTX 3060) driving the LED wall via HDMI/DisplayPort.
  - Run the wall renderer as Chromium in kiosk mode or Electron app.
- **Server:**
  - Host Node.js gateway on cloud VM (AWS EC2) or on-prem box; ensure low-latency network with Wi-Fi access point dedicated to installation.
  - Co-locate Redis for minimal latency (<5 ms typical).
- **Networking:**
  - Dedicated Wi-Fi SSID for participants.
  - Use TLS certificates (Let's Encrypt) for secure WebSocket (wss://).

## 9. Reliability & Moderation
- Add profanity filter if nicknames/messages shown.
- Provide "panic" button on admin panel to clear canvas instantly.
- Logging: store aggregated metrics (strokes/min, unique users) for reporting.
- Offline fallback: if gateway disconnects, controller informs users to retry.

## 10. Project Timeline (Suggested)
1. **Week 1-2:** UX design, wireframes, prototype controller UI and wall renderer locally.
2. **Week 3:** Implement WebSocket gateway, integrate real-time drawing, basic TTL cleanup.
3. **Week 4:** Polish visuals, add admin tools, optimize performance, run load tests.
4. **Week 5:** Deploy staging environment, conduct on-site rehearsal with real hardware.
5. **Week 6:** Final tweaks, produce QR code assets, documentation, and support plan.

## 11. Future Enhancements
- Record time-lapse video of the wall by capturing frames.
- Introduce themed challenges (prompts) that cycle automatically.
- Integrate social sharing (email/SMS links to participant’s strokes).
- Support multi-wall sync for larger installations.

## 12. Open Source & Libraries to Explore
- Drawing libraries: `fabric.js`, `paper.js`, `rough.js`, `pixi.js`.
- Real-time frameworks: Socket.IO, Colyseus, Liveblocks.
- TTL management: Redis Streams, Upstash, or AWS ElastiCache with key expiration events.

