import { createSharedWall } from "./shared-wall.js";

const canvas = document.getElementById("paint-canvas");
const wall = createSharedWall(canvas);
const colorButtons = Array.from(document.querySelectorAll(".color-chip"));
const sizeInput = document.getElementById("brush-size");
const sizeLabel = document.getElementById("size-label");
const identityContainer = document.getElementById("identity");
const clearButton = document.getElementById("clear-button");

const socket = io();
let currentColor = colorButtons[0].dataset.color;
let drawing = false;
let lastEmit = 0;

function updateIdentity() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "Guest";
  const email = params.get("email") || "";

  identityContainer.textContent = "";

  const label = document.createElement("span");
  label.textContent = "Signed in as ";

  const strong = document.createElement("strong");
  strong.textContent = name;
  label.appendChild(strong);
  identityContainer.appendChild(label);

  if (email) {
    const separator = document.createElement("span");
    separator.className = "identity__separator";
    separator.textContent = "·";
    identityContainer.appendChild(separator);

    const emailSpan = document.createElement("span");
    emailSpan.textContent = email;
    identityContainer.appendChild(emailSpan);
  }
}

function setActiveColor(button) {
  for (const btn of colorButtons) {
    btn.classList.toggle("is-active", btn === button);
  }
  currentColor = button.dataset.color;
}

colorButtons.forEach((button) => {
  button.style.setProperty("--chip-color", button.dataset.color);
  button.addEventListener("click", () => setActiveColor(button));
});

function describeSize(value) {
  if (value <= 0.04) return "fine";
  if (value <= 0.07) return "medium";
  return "bold";
}

function updateSizeLabel() {
  const value = parseFloat(sizeInput.value);
  sizeLabel.textContent = describeSize(value);
}

sizeInput.addEventListener("input", updateSizeLabel);
updateSizeLabel();

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

function emitStroke(stroke) {
  const now = performance.now();
  if (now - lastEmit > 12) {
    socket.emit("spray", stroke);
    lastEmit = now;
  }
}

function spray(event) {
  const { x, y } = getPointerPosition(event);
  const radius = parseFloat(sizeInput.value);
  const stroke = { x, y, radius, color: currentColor };
  wall.addStroke(stroke);
  emitStroke(stroke);
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  drawing = true;
  spray(event);
});

canvas.addEventListener("pointermove", (event) => {
  if (!drawing) return;
  spray(event);
});

function stopDrawing(event) {
  if (!drawing) return;
  drawing = false;
  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch (error) {
    // Ignore release errors
  }
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

socket.on("init", (strokes) => {
  wall.load(strokes);
});

socket.on("spray", (stroke) => {
  wall.addStroke(stroke);
});

socket.on("clear", () => {
  wall.clear();
});

clearButton.addEventListener("click", () => {
  socket.emit("clear");
});

updateIdentity();
