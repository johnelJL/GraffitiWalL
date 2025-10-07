# Graffiti WalL manual test plan

Use this checklist whenever you want to validate the full wall experience.

## Setup
- Open `index.html` directly in a browser, or start a lightweight server (for example `npx serve`) from the repository root and visit the provided URL.
- Ensure your browser allows `localStorage` access; disable private browsing modes that block it.

## Test cases

1. **Composer renders**
   - The page shows the gradient background, composer form, color palette, prompt button, and an empty notes area.
2. **Create a note**
   - Fill out name, pick a swatch, and type a message.
   - Click **Post tag** and confirm the note appears with the chosen color and timestamp.
3. **Persistence**
   - Reload the page. The note should still be visible with the same data.
4. **Like toggle**
   - Click the heart icon twice and confirm the count increments each time without duplicating likes after refresh.
5. **Prompt injection**
   - Hit **Surprise me**. Verify the composer textarea is pre-populated without submitting automatically.
6. **Delete single note**
   - Use the trash icon to remove the note and confirm it disappears immediately and after refresh.
7. **Clear wall**
   - Add two notes, press **Clear wall**, and confirm the wall is empty. Refresh to ensure `localStorage` is cleared.
8. **Accessibility basics**
   - Use the Tab key to move through inputs and buttons in a logical order and ensure focus indicators are visible.

Document any deviations you find so they can be triaged.
