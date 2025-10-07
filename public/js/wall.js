import { createSharedWall } from "./shared-wall.js";

const canvas = document.getElementById("wall-canvas");
const wall = createSharedWall(canvas);
const status = document.createElement("div");
status.className = "connection-status";
status.textContent = "Connecting…";
document.body.appendChild(status);

const socket = io();

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
