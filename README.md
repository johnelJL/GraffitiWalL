# Graffiti Video Wall

A collaborative mural experience where every visitor paints on the same digital wall. Identify yourself, pick a brush, and see every stroke appear live—perfect for lobby displays, classrooms, or large-format video walls.

## Features

- 🖌️ Draw directly on the shared canvas with mouse, pen, or touch support.
- 🎨 Choose brush colours and sizes with an instant live preview.
- 🧑‍🎨 Capture each artist's name and email before they can start painting.
- 🔄 Real-time synchronisation across browser windows using the Broadcast Channel API (with `localStorage` fallback).
- 🧹 Clear the entire wall for all connected artists with a single action.
- 💾 Every stroke persists locally, so refreshing the page keeps the mural intact.

## Getting started

1. Serve the project locally (recommended) or open `index.html` directly in a modern browser.
   - For example: `npx serve` or `python3 -m http.server` from the project root.
2. Fill in your name and email on the left control panel.
3. Pick a colour and brush size, then click or tap the canvas to draw.
4. Open the page in another tab/window to watch collaborative strokes appear instantly.

No build step is required—the entire experience runs in the browser.

## Manual test checklist

1. **Launch the wall**
   - Open `index.html` in two separate tabs or windows.
2. **Set identity**
   - Enter a name and email in one tab and confirm the identity banner updates.
3. **Draw a stroke**
   - Paint on the canvas and verify the stroke appears simultaneously in the second tab.
4. **Change brush settings**
   - Adjust colour and size; confirm the preview updates and new strokes reflect the change.
5. **Persist strokes**
   - Refresh a tab and ensure the existing artwork is redrawn from storage.
6. **Clear the wall**
   - Use the clear button in one tab and confirm both canvases reset.

These steps cover the full collaborative workflow to make sure the video wall delivers a seamless shared experience.
