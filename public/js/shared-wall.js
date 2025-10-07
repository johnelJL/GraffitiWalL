const BACKGROUND = "#05050a";

function drawSpray(ctx, canvas, stroke) {
  const actualX = stroke.x * canvas.width;
  const actualY = stroke.y * canvas.height;
  const radius = stroke.radius * canvas.width;
  const dropletRadius = Math.max(radius * 0.05, 1.5 * (window.devicePixelRatio || 1));
  const count = Math.max(24, Math.round(30 + radius * 0.6));

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    ctx.globalAlpha = 0.15 + Math.random() * 0.55;
    ctx.beginPath();
    ctx.fillStyle = stroke.color;
    ctx.arc(actualX + dx, actualY + dy, dropletRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function createSharedWall(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  const MAX_STROKES = 15000;
  let strokes = [];

  function paintBackground() {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function redraw() {
    paintBackground();
    for (const stroke of strokes) {
      drawSpray(ctx, canvas, stroke);
    }
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    redraw();
  }

  function load(newStrokes) {
    strokes = Array.isArray(newStrokes) ? newStrokes.slice(-MAX_STROKES) : [];
    redraw();
  }

  function addStroke(stroke) {
    strokes.push(stroke);
    if (strokes.length > MAX_STROKES) {
      strokes.splice(0, strokes.length - MAX_STROKES);
    }
    drawSpray(ctx, canvas, stroke);
  }

  function clear() {
    strokes = [];
    redraw();
  }

  const debouncedResize = () => {
    window.requestAnimationFrame(resize);
  };

  window.addEventListener("resize", debouncedResize);
  setTimeout(resize, 0);

  return {
    load,
    addStroke,
    clear,
    redraw: resize,
    getStrokes: () => [...strokes],
  };
}
