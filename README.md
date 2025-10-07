# Graffiti WalL

A playful single-page web app where anyone can leave a colorful note on the shared graffiti wall. Notes are stored locally in the browser so you can experiment freely without a backend.

## Features

- ✏️ Compose notes with your name, message, and a color theme
- 🧠 Get inspiration with the "Surprise" prompt generator
- ❤️ Like notes and see real-time counts
- 🗑️ Delete individual notes or clear the entire wall
- 💾 Notes persist in `localStorage` across visits on the same browser

## Getting started

1. Open `index.html` in your favorite browser.
2. Start adding messages to the wall.

No build step required—everything runs directly in the browser.

## Testing the experience

Want to walk through the full graffiti wall flow? Follow these steps for a quick manual check:

1. **Launch the wall**
   - Either double-click `index.html` or run a local server with `npx serve` (requires Node.js) from the project root and open the provided URL.
2. **Add a note**
   - Enter a name, pick a color, type a message, and submit. Confirm your note appears instantly in the "Latest tags" panel.
3. **Engage with reactions**
   - Click the heart on the new note and verify the like counter increments and persists after refreshing the page.
4. **Try the prompt generator**
   - Press "Surprise me" to pre-fill the composer with a random idea, then tweak it as desired before posting.
5. **Clean up**
   - Remove a single note via its trash icon, then clear the entire wall using the "Clear wall" button. Refresh once more to ensure everything stays cleared.

These steps exercise every interactive control so you can be confident the whole activation works end to end.

## Development tips

- The project uses vanilla JavaScript and CSS.
- Notes are stored under the `graffiti-wall-notes` key in `localStorage`. You can clear it via the "Clear wall" button or through your browser devtools.
- To reset likes or messages manually, remove the item from storage and reload the page.
