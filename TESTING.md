# Graffiti Wall manual test plan

Follow this checklist to validate the full flow before an event.

## Setup

1. Install dependencies with `npm install`.
2. Run `npm start` and wait for the `Graffiti Wall listening` message.
3. Open two browser windows/tabs: one for the wall (`/`) and another for the painter (`/paint`).

## Test cases

1. **Wall renders**
   - The video wall view shows the canvas, overlay title, QR code, and connection badge.
   - The status badge reports “Live” after the socket connects.
2. **Join flow**
   - Visit `/join`, leave each field empty in turn, and confirm inline validation errors appear.
   - Submit valid details and confirm the browser is redirected to `/paint?name=...&email=...`.
3. **Canvas sync**
   - Draw on the painter canvas; the same spray appears on the wall instantly.
   - Open a third browser (or refresh the wall) and ensure historic sprays replay after connecting.
4. **Color palette & size**
   - Switch through each color chip and draw; each color renders correctly.
   - Move the radius slider between min and max and confirm the spray footprint changes.
5. **Multi-user**
   - With two painter tabs, draw simultaneously and verify both streams appear without lag.
6. **Clear wall**
   - Press “Clear wall (host only)” and confirm every connected client clears immediately.
7. **Responsive layout**
   - Resize the browser to tablet/mobile widths to ensure the canvas scales and controls remain usable.

Document any issues you find along with the steps to reproduce them.
