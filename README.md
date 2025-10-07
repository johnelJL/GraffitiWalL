# Graffiti Wall

A collaborative graffiti experience for events. Display the wall on a large screen and let visitors join from their phones by scanning the QR code. Every spray action appears live on the video wall.

## Features

- 📺 **Video wall view** – Hosts run `/` to show the shared canvas and QR code.
- 📱 **Join flow** – Guests enter their name, email, and agree to the guidelines before painting.
- 🎨 **Spray controls** – Five preset colors and an adjustable spray radius feel like a can of paint.
- 🔄 **Real-time sync** – Built with Socket.IO so every mark is broadcast instantly to every connected screen.
- 🧹 **Host clear** – Trigger a full reset of the wall from the painter page when needed.

## Getting started

1. Install dependencies.

   ```bash
   npm install
   ```

2. Start the collaboration server.

   ```bash
   npm start
   ```

3. Open the wall view (defaults to [`http://localhost:3000/`](http://localhost:3000/)) on the main display.
4. Ask guests to scan the QR code or visit [`http://localhost:3000/join`](http://localhost:3000/join) on their devices.

## Development tips

- Use `npm run dev` for automatic restarts when editing the server.
- Sprays are stored in memory only. Restarting the server clears the canvas for everyone.
- The wall automatically adapts to the browser window size; resize the window after connecting if you change the display resolution.

## Folder structure

```
public/
  index.html      # video wall
  join.html       # registration form
  paint.html      # painter controls
  js/             # browser logic
server.js         # express + socket.io server
styles.css        # shared styling
```

Enjoy the pop-up street art session! ✨
