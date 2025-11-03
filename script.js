const canvasArea = document.getElementById("canvas");
const drawCanvas = document.getElementById("drawCanvas");
const ctx = drawCanvas.getContext("2d");
const elementsLayer = document.getElementById("elements-layer");
const petunjuk = document.getElementById("petunjuk");

drawCanvas.width = canvasArea.offsetWidth;
drawCanvas.height = canvasArea.offsetHeight;

let mode = "draw";
let drawing = false;
let startX, startY;
let lines = [];
let tempStart = null;

// Tombol
const btnDraw = document.getElementById("modeDraw");
const btnClick = document.getElementById("modeClick");
const btnUndo = document.getElementById("undo");

btnDraw.classList.add("active");
btnDraw.onclick = () => setMode("draw");
btnClick.onclick = () => setMode("click");
btnUndo.onclick = undoLine;

// ====================================================
// MODE HANDLER
// ====================================================
function setMode(m) {
  mode = m;
  btnDraw.classList.toggle("active", m === "draw");
  btnClick.classList.toggle("active", m === "click");

  drawing = false;
  tempStart = null;

  drawCanvas.onmousedown = null;
  drawCanvas.onmousemove = null;
  drawCanvas.onmouseup = null;
  drawCanvas.onclick = null;

  if (m === "draw") {
    activateDrawMode();
    drawCanvas.style.pointerEvents = "auto";
    elementsLayer.style.pointerEvents = "none";
    drawCanvas.style.zIndex = 5;
    elementsLayer.style.zIndex = 4;
  }

  if (m === "click") {
    activateClickMode();
    drawCanvas.style.pointerEvents = "none";
    elementsLayer.style.pointerEvents = "auto";
    drawCanvas.style.zIndex = 4;
    elementsLayer.style.zIndex = 5;
  }

  drawCanvas.style.cursor = m === "draw" ? "crosshair" : "pointer";
}

// ====================================================
// UNDO GARIS
// ====================================================
function undoLine() {
  lines.pop();
  redrawAll();
}

// ====================================================
// MODE GAMBAR (PAINT TO LINE)
// ====================================================
function activateDrawMode() {
  drawCanvas.onmousedown = (e) => {
    drawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
  };

  drawCanvas.onmousemove = (e) => {
    if (!drawing) return;
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    redrawAll();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2a4d8f";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  drawCanvas.onmouseup = (e) => {
    if (!drawing) return;
    drawing = false;
    const rect = drawCanvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    lines.push({ x1: startX, y1: startY, x2: endX, y2: endY });
    redrawAll();
  };
}

// ====================================================
// MODE KLIK (DOT TO DOT)
// ====================================================
function activateClickMode() {
  drawCanvas.onclick = (e) => {
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!tempStart) {
      tempStart = { x, y };
      drawPoint(x, y, "#ff0000");
    } else {
      lines.push({ x1: tempStart.x, y1: tempStart.y, x2: x, y2: y });
      tempStart = null;
      redrawAll();
    }
  };
}

// ====================================================
// UTILITAS GARIS & TITIK
// ====================================================
function drawPoint(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function redrawAll() {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  for (let l of lines) {
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = "#2a4d8f";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// ====================================================
// DRAG & DROP ELEMEN
// ====================================================
document.querySelectorAll(".elemen").forEach((el) => {
  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("id", e.currentTarget.id);
  });
});

elementsLayer.addEventListener("dragover", (e) => e.preventDefault());

elementsLayer.addEventListener("drop", (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData("id");
  const draggedEl = document.getElementById(id);
  if (!draggedEl) return;

  if (petunjuk) petunjuk.style.display = "none";

  const rect = elementsLayer.getBoundingClientRect();
  const x = e.clientX - rect.left - 50;
  const y = e.clientY - rect.top - 50;

  const clone = document.createElement("div");
  clone.classList.add("resizable");
  clone.style.left = `${x}px`;
  clone.style.top = `${y}px`;
  clone.style.width = "100px";
  clone.style.height = "100px";

  const img = document.createElement("img");
  img.src = draggedEl.querySelector("img").src;
  img.alt = "elemen";
  clone.appendChild(img);

  const handle = document.createElement("div");
  handle.classList.add("resize-handle");
  clone.appendChild(handle);

  elementsLayer.appendChild(clone);

  makeDraggable(clone);
  makeResizable(clone, handle);
});

// ====================================================
// DRAG & RESIZE
// ====================================================
function makeDraggable(el) {
  let isDragging = false;
  let offsetX, offsetY;

  el.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("resize-handle")) return;
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = 10;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const rect = elementsLayer.getBoundingClientRect();
    let newX = e.clientX - rect.left - offsetX;
    let newY = e.clientY - rect.top - offsetY;
    newX = Math.max(0, Math.min(newX, elementsLayer.offsetWidth - el.offsetWidth));
    newY = Math.max(0, Math.min(newY, elementsLayer.offsetHeight - el.offsetHeight));
    el.style.left = `${newX}px`;
    el.style.top = `${newY}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    el.style.zIndex = 5;
  });
}

function makeResizable(el, handle) {
  let isResizing = false;
  let startX, startY, startW, startH;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = parseInt(window.getComputedStyle(el).width, 10);
    startH = parseInt(window.getComputedStyle(el).height, 10);
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    let newW = startW + (e.clientX - startX);
    let newH = startH + (e.clientY - startY);
    newW = Math.max(60, newW);
    newH = Math.max(60, newH);
    el.style.width = newW + "px";
    el.style.height = newH + "px";
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
  });
}

// Jalankan mode awal
activateDrawMode();

// === Tampilkan / Sembunyikan Kunci Jawaban ===
const btnKunci = document.getElementById("toggleKunci");
const divKunci = document.getElementById("canvasKunci");

btnKunci.onclick = () => {
  if (divKunci.style.display === "none" || divKunci.style.display === "") {
    divKunci.style.display = "block";
    btnKunci.textContent = "🙈 Sembunyikan Kunci Jawaban";
  } else {
    divKunci.style.display = "none";
    btnKunci.textContent = "👁️ Tampilkan Kunci Jawaban";
  }
};
