import { createSharedWall } from "./shared-wall.js";

const canvas = document.getElementById("paint-canvas");
const wall = createSharedWall(canvas);
const canvasWrapper = canvas.parentElement || document.body;
const colorButtons = Array.from(document.querySelectorAll(".color-chip"));
const sizeInput = document.getElementById("brush-size");
const sizeLabel = document.getElementById("size-label");
const identityContainer = document.getElementById("identity");
const clearButton = document.getElementById("clear-button");

const cursor = document.createElement("div");
cursor.className = "spray-cursor";
canvasWrapper.appendChild(cursor);

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
  updateCursorAppearance();
}

colorButtons.forEach((button) => {
  button.style.setProperty("--chip-color", button.dataset.color);
  button.addEventListener("click", () => setActiveColor(button));
});

function hexToRgba(hex, alpha = 1) {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateCursorAppearance() {
  cursor.style.borderColor = currentColor;
  cursor.style.boxShadow = `0 0 14px ${hexToRgba(currentColor, 0.65)}`;
}

function updateSizeLabel() {
  const value = Math.round(parseFloat(sizeInput.value));
  sizeLabel.textContent = `${value}px`;
}

function updateCursorSize() {
  const radius = parseFloat(sizeInput.value);
  const diameter = Math.max(1, radius * 2);
  cursor.style.width = `${diameter}px`;
  cursor.style.height = `${diameter}px`;
}

function getBrushRadiusPx() {
  return parseFloat(sizeInput.value);
}

function getNormalizedRadius() {
  const rect = canvas.getBoundingClientRect();
  const radiusPx = getBrushRadiusPx();
  return rect.width > 0 ? radiusPx / rect.width : 0;
}

function updateCursorPosition(event) {
  if (!canvasWrapper) return;
  const wrapperRect = canvasWrapper.getBoundingClientRect();
  cursor.style.left = `${event.clientX - wrapperRect.left}px`;
  cursor.style.top = `${event.clientY - wrapperRect.top}px`;
}

sizeInput.addEventListener("input", () => {
  updateSizeLabel();
  updateCursorSize();
});
updateSizeLabel();
updateCursorSize();
updateCursorAppearance();

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
  const radius = getNormalizedRadius();
  const stroke = { x, y, radius, color: currentColor };
  wall.addStroke(stroke);
  emitStroke(stroke);
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  drawing = true;
  updateCursorPosition(event);
  spray(event);
});

canvas.addEventListener("pointermove", (event) => {
  updateCursorPosition(event);
  if (!drawing) return;
  spray(event);
});

canvas.addEventListener("pointerenter", (event) => {
  canvas.classList.add("is-hovered");
  cursor.classList.add("is-visible");
  updateCursorPosition(event);
});

canvas.addEventListener("pointerleave", () => {
  canvas.classList.remove("is-hovered");
  cursor.classList.remove("is-visible");
  drawing = false;
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
