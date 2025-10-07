const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const QRCode = require("qrcode");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3000;
const MAX_STROKES = 15000;

/**
 * In-memory store of spray events.
 * Each stroke: { x: number, y: number, radius: number, color: string }
 */
const strokes = [];

app.use(express.static(path.join(__dirname, "public")));

app.get("/join", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "join.html"));
});

app.get("/paint", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "paint.html"));
});

app.get("/qr.png", async (req, res) => {
  try {
    const protocol = req.protocol;
    const host = req.get("host");
    const joinUrl = `${protocol}://${host}/join`;
    const buffer = await QRCode.toBuffer(joinUrl, {
      width: 500,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    res.type("png").send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Could not generate QR code" });
  }
});

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidStroke(payload) {
  return (
    payload &&
    typeof payload.color === "string" &&
    payload.color.length <= 30 &&
    isValidNumber(payload.x) &&
    isValidNumber(payload.y) &&
    isValidNumber(payload.radius) &&
    payload.x >= 0 &&
    payload.x <= 1 &&
    payload.y >= 0 &&
    payload.y <= 1 &&
    payload.radius > 0 &&
    payload.radius <= 0.5
  );
}

io.on("connection", (socket) => {
  socket.emit("init", strokes);

  socket.on("spray", (payload) => {
    if (!isValidStroke(payload)) {
      return;
    }

    strokes.push(payload);
    if (strokes.length > MAX_STROKES) {
      strokes.splice(0, strokes.length - MAX_STROKES);
    }

    socket.broadcast.emit("spray", payload);
  });

  socket.on("clear", () => {
    strokes.length = 0;
    io.emit("clear");
  });
});

server.listen(PORT, () => {
  console.log(`Graffiti Wall listening on http://localhost:${PORT}`);
});
