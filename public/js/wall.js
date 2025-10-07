import { createSharedWall } from "./shared-wall.js";

const canvas = document.getElementById("wall-canvas");
const wall = createSharedWall(canvas);
const status = document.createElement("div");
status.className = "connection-status";
status.textContent = "Connecting…";
document.body.appendChild(status);

function createNoopSocket() {
  const listeners = new Map();

  return {
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(handler);
      if (event === "init") {
        handler([]);
      }
      if (event === "disconnect") {
        handler();
      }
    },
    emit() {},
  };
}

const isStaticPreview =
  typeof window !== "undefined" &&
  (window.location.protocol === "file:" ||
    window.location.pathname.startsWith("/public/"));

const socket =
  !isStaticPreview &&
  typeof window !== "undefined" &&
  typeof window.io === "function"
    ? window.io({
        reconnectionAttempts: 1,
        timeout: 2000,
      })
    : createNoopSocket();

if (socket && typeof socket.on === "function") {
  socket.on("connect_error", () => {
    if (typeof socket.disconnect === "function") {
      socket.disconnect();
    }
    status.textContent = "Offline";
    status.classList.add("is-offline");
  });
}

socket.on("connect", () => {
  status.textContent = "Live";
  status.classList.remove("is-offline");
});

socket.on("disconnect", () => {
  status.textContent = "Offline";
  status.classList.add("is-offline");
});

socket.on("init", (strokes) => {
  wall.load(strokes);
});

socket.on("spray", (stroke) => {
  wall.addStroke(stroke);
});

socket.on("clear", () => {
  wall.clear();
});
