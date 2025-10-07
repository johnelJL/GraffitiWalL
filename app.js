const STROKE_STORAGE_KEY = "graffiti-wall-strokes-v1";
const IDENTITY_STORAGE_KEY = "graffiti-wall-identity";
const BROADCAST_KEY = "graffiti-wall-broadcast";

const form = document.querySelector("#artist-form");
const nameInput = document.querySelector("#artist-name");
const emailInput = document.querySelector("#artist-email");
const colorInputs = Array.from(document.querySelectorAll('input[name="brush-color"]'));
const sizeInput = document.querySelector("#brush-size");
const brushPreview = document.querySelector("#brush-preview");
const canvas = document.querySelector("#wall-canvas");
const hint = document.querySelector("#wall-hint");
const identityDisplay = document.querySelector("#identity-display");
const clearButton = document.querySelector("#clear-wall");

const ctx = canvas.getContext("2d");
const sessionId = crypto.randomUUID();
const broadcastChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("graffiti-wall") : null;

/** @type {{id: string, author: string, email: string, color: string, size: number, points: {x: number, y: number}[]}[]} */
let strokes = [];
/** @type {{id: string, author: string, email: string, color: string, size: number, points: {x: number, y: number}[]} | null} */
let currentStroke = null;
let drawing = false;
const remoteStrokes = new Map();

const identity = loadIdentity();
applyIdentityToForm(identity);
updateIdentityDisplay();

configureCanvas();
strokes = loadStrokes();
redraw();

// Identity management
nameInput.addEventListener("input", () => {
  identity.name = nameInput.value.trim();
  persistIdentity();
  updateIdentityDisplay();
});

emailInput.addEventListener("input", () => {
  identity.email = emailInput.value.trim();
  persistIdentity();
  updateIdentityDisplay();
});

colorInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateBrushPreview();
  });
});

sizeInput.addEventListener("input", () => {
  updateBrushPreview();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
});

clearButton.addEventListener("click", () => {
  if (strokes.length === 0 && remoteStrokes.size === 0) return;
  const confirmed = window.confirm("Clear the entire wall for everyone? This cannot be undone.");
  if (!confirmed) return;
  clearAllStrokes({ broadcast: true });
});

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);
canvas.addEventListener("pointerleave", handlePointerUp);

window.addEventListener("resize", () => {
  configureCanvas();
  redraw();
});

if (broadcastChannel) {
  broadcastChannel.addEventListener("message", (event) => {
    handleRemoteMessage(event.data);
  });
}

window.addEventListener("storage", (event) => {
  if (event.key !== BROADCAST_KEY || !event.newValue) return;
  try {
    const payload = JSON.parse(event.newValue);
    handleRemoteMessage(payload);
  } catch (error) {
    console.warn("Failed to parse broadcast payload", error);
  }
});

updateBrushPreview();
updateHint();

function handlePointerDown(event) {
  if (!form.reportValidity()) {
    return;
  }
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);
  startStroke(event);
}

function handlePointerMove(event) {
  if (!drawing || !currentStroke) return;
  event.preventDefault();
  const point = getCanvasPoint(event);
  currentStroke.points.push(point);
  drawStrokeSegment(currentStroke, currentStroke.points.length - 2);
  broadcast({
    type: "stroke-extend",
    id: currentStroke.id,
    point,
  });
}

function handlePointerUp(event) {
  if (!drawing || !currentStroke) return;
  if (event.pointerId != null) {
    canvas.releasePointerCapture?.(event.pointerId);
  }
  drawing = false;
  if (currentStroke.points.length > 0) {
    strokes.push(currentStroke);
    saveStrokes(strokes);
    broadcast({
      type: "stroke-end",
      stroke: currentStroke,
    });
  }
  currentStroke = null;
  redraw();
  updateHint();
}

function startStroke(event) {
  const color = getSelectedColor();
  const size = Number(sizeInput.value) || 8;
  const point = getCanvasPoint(event);
  currentStroke = {
    id: crypto.randomUUID(),
    author: identity.name,
    email: identity.email,
    color,
    size,
    points: [point],
  };
  drawing = true;
  drawStrokeSegment(currentStroke);
  updateHint();
  broadcast({
    type: "stroke-start",
    stroke: {
      id: currentStroke.id,
      author: currentStroke.author,
      email: currentStroke.email,
      color: currentStroke.color,
      size: currentStroke.size,
      points: [...currentStroke.points],
    },
  });
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function drawStrokeSegment(stroke, fromIndex = 0) {
  if (!stroke.points.length) return;
  const startIndex = Math.max(0, fromIndex);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size;

  if (stroke.points.length === 1) {
    const [point] = stroke.points;
    ctx.beginPath();
    ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const points = stroke.points;
  ctx.beginPath();
  ctx.moveTo(points[startIndex].x, points[startIndex].y);
  for (let i = startIndex + 1; i < points.length; i += 1) {
    const point = points[i];
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.restore();
}

function redraw() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const ratio = window.devicePixelRatio || 1;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  for (const stroke of strokes) {
    drawStrokeSegment(stroke);
  }

  if (currentStroke) {
    drawStrokeSegment(currentStroke);
  }

  for (const stroke of remoteStrokes.values()) {
    drawStrokeSegment(stroke);
  }
}

function configureCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  const displayWidth = Math.round(width * ratio);
  const displayHeight = Math.round(height * ratio);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function loadStrokes() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STROKE_STORAGE_KEY));
    if (!Array.isArray(stored)) {
      return [];
    }
    return stored
      .map((stroke) => ({
        id: String(stroke.id ?? ""),
        author: String(stroke.author ?? ""),
        email: String(stroke.email ?? ""),
        color: String(stroke.color ?? "#f97316"),
        size: Number(stroke.size ?? 8),
        points: Array.isArray(stroke.points)
          ? stroke.points
              .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
              .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
          : [],
      }))
      .filter((stroke) => stroke.points.length > 0);
  } catch (error) {
    console.warn("Failed to load stored strokes", error);
    return [];
  }
}

function saveStrokes(data) {
  try {
    window.localStorage.setItem(STROKE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save strokes", error);
  }
}

function loadIdentity() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(IDENTITY_STORAGE_KEY));
    if (!stored || typeof stored !== "object") {
      return { name: "", email: "" };
    }
    return {
      name: String(stored.name ?? ""),
      email: String(stored.email ?? ""),
    };
  } catch (error) {
    return { name: "", email: "" };
  }
}

function persistIdentity() {
  try {
    window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  } catch (error) {
    console.warn("Failed to save identity", error);
  }
}

function applyIdentityToForm(value) {
  nameInput.value = value.name ?? "";
  emailInput.value = value.email ?? "";
}

function updateIdentityDisplay() {
  if (identity.name && identity.email) {
    identityDisplay.textContent = `Painting as ${identity.name} • ${identity.email}`;
  } else if (identity.name) {
    identityDisplay.textContent = `Painting as ${identity.name}`;
  } else {
    identityDisplay.textContent = "Set your name and email to appear on the wall.";
  }
}

function getSelectedColor() {
  const selected = colorInputs.find((input) => input.checked);
  return selected ? selected.value : "#f97316";
}

function updateBrushPreview() {
  const color = getSelectedColor();
  const size = Number(sizeInput.value) || 12;
  brushPreview.style.background = color;
  const dimension = Math.max(size, 12);
  brushPreview.style.width = `${dimension}px`;
  brushPreview.style.height = `${dimension}px`;
  brushPreview.style.borderColor = color === "#facc15" ? "rgba(15, 23, 42, 0.45)" : "rgba(148, 163, 184, 0.3)";
}

function updateHint() {
  const hasAnyStroke = strokes.length > 0 || remoteStrokes.size > 0;
  hint.hidden = hasAnyStroke || drawing;
}

function broadcast(message) {
  const payload = { ...message, senderId: sessionId, timestamp: Date.now() };
  if (broadcastChannel) {
    broadcastChannel.postMessage(payload);
  } else {
    try {
      window.localStorage.setItem(BROADCAST_KEY, JSON.stringify(payload));
      window.localStorage.removeItem(BROADCAST_KEY);
    } catch (error) {
      console.warn("Failed to broadcast message", error);
    }
  }
}

function handleRemoteMessage(message) {
  if (!message || message.senderId === sessionId) return;
  switch (message.type) {
    case "stroke-start": {
      const stroke = normaliseStroke(message.stroke);
      if (!stroke) return;
      remoteStrokes.set(stroke.id, stroke);
      drawStrokeSegment(stroke);
      updateHint();
      break;
    }
    case "stroke-extend": {
      const stroke = remoteStrokes.get(message.id);
      if (!stroke) return;
      const point = message.point;
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      stroke.points.push({ x: Number(point.x), y: Number(point.y) });
      drawStrokeSegment(stroke, stroke.points.length - 2);
      break;
    }
    case "stroke-end": {
      const stroke = normaliseStroke(message.stroke);
      if (!stroke) return;
      remoteStrokes.delete(stroke.id);
      if (!strokes.some((existing) => existing.id === stroke.id)) {
        strokes.push(stroke);
        saveStrokes(strokes);
      }
      redraw();
      updateHint();
      break;
    }
    case "clear": {
      remoteStrokes.clear();
      currentStroke = null;
      drawing = false;
      clearAllStrokes({ broadcast: false });
      break;
    }
    default:
      break;
  }
}

function normaliseStroke(rawStroke) {
  if (!rawStroke || !Array.isArray(rawStroke.points) || rawStroke.points.length === 0) {
    return null;
  }
  const points = rawStroke.points
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (points.length === 0) {
    return null;
  }
  return {
    id: String(rawStroke.id ?? crypto.randomUUID()),
    author: String(rawStroke.author ?? ""),
    email: String(rawStroke.email ?? ""),
    color: String(rawStroke.color ?? "#f97316"),
    size: Number(rawStroke.size ?? 8),
    points,
  };
}

function clearAllStrokes({ broadcast: shouldBroadcast }) {
  strokes = [];
  remoteStrokes.clear();
  currentStroke = null;
  drawing = false;
  saveStrokes(strokes);
  redraw();
  updateHint();
  if (shouldBroadcast) {
    broadcast({ type: "clear" });
  }
}
