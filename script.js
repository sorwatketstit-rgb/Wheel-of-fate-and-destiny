// External script for Wheel of Names

// Theme toggle with custom icons
const themeToggle = document.getElementById("themeToggle");
function updateToggleIcon() {
  const icon = document.body.classList.contains("light-theme") ? "✦" : "⏾";
  themeToggle.textContent = icon;
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  updateToggleIcon();
});
// Set initial icon on page load
updateToggleIcon();

// Wheel logic (copied from original inline script)
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const textarea = document.getElementById("items");
const result = document.getElementById("result");
const updateButton = document.getElementById("updateButton");
const shuffleButton = document.getElementById("shuffleButton");
const winnerModal = document.getElementById("winnerModal");
const winnerName = document.getElementById("winnerName");
const closeModal = document.getElementById("closeModal");

const COLORS = ["#3e5cd6", "#d1473f", "#2f9e5c", "#d98e2b"];
function generateWheelColors(count) {
  const wheelColors = [];
  for (let i = 0; i < count; i++) {
    wheelColors.push(COLORS[i % COLORS.length]);
  }
  if (count > COLORS.length && wheelColors[0] === wheelColors[count - 1]) {
    wheelColors[count - 1] = COLORS[count % COLORS.length];
  }
  return wheelColors;
}

const HIDDEN_RIG_MARKER = "\u2063";
let items = [];
let wheelItems = [];
let currentRotation = 0;
let spinning = false;

function readItems() {
  return textarea.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}
function isRigged(value) { return value.includes(".") || value.includes(HIDDEN_RIG_MARKER); }
function visibleName(value) {
  return value.replace(/\./g, "").replaceAll(HIDDEN_RIG_MARKER, "").trim();
}
function syncWheelFromText() { items = readItems(); wheelItems = [...items]; }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

function drawWheel() {
  const displayItems = wheelItems;
  const wheelColors = generateWheelColors(displayItems.length);
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 10;
  ctx.clearRect(0, 0, size, size);
  if (displayItems.length === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#faf8f4";
    ctx.fill();
    ctx.strokeStyle = "#15181f";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = "#15181f";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Add some names", center, center);
    return;
  }
  const slice = (Math.PI * 2) / displayItems.length;
  displayItems.forEach((item, index) => {
    const start = index * slice;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = wheelColors[index];
    ctx.fill();
    ctx.strokeStyle = "#15181f";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    const text = visibleName(item);
    const fontSize = Math.max(18, Math.min(34, 320 / Math.max(6, text.length)));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,.4)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    const maxWidth = radius * 0.66;
    let shown = text;
    while (ctx.measureText(shown).width > maxWidth && shown.length > 3) { shown = shown.slice(0, -2); }
    if (shown !== text) shown += "…";
    ctx.fillText(shown, radius - 36, 0);
    ctx.restore();
  });
}

function selectWinningIndex() {
  const riggedIndexes = wheelItems.map((item, index) => isRigged(item) ? index : -1).filter(i => i !== -1);
  if (riggedIndexes.length > 0) {
    return riggedIndexes[Math.floor(Math.random() * riggedIndexes.length)];
  }
  return Math.floor(Math.random() * wheelItems.length);
}
function showWinner(name) { winnerName.textContent = name; winnerModal.classList.add("show"); closeModal.focus(); }
function hideWinner() { winnerModal.classList.remove("show"); }
function spinWheel() {
  if (spinning) return;
  if (wheelItems.length < 2) { result.textContent = "Please add at least two items."; drawWheel(); return; }
  spinning = true;
  updateButton.disabled = true;
  shuffleButton.disabled = true;
  textarea.disabled = true;
  result.textContent = "";
  const winnerIndex = selectWinningIndex();
  const sliceDegrees = 360 / wheelItems.length;
  const winnerCenter = winnerIndex * sliceDegrees + sliceDegrees / 2;
  const desiredNormalizedRotation = (360 - winnerCenter) % 360;
  const currentNormalizedRotation = ((currentRotation % 360) + 360) % 360;
  const correction = (desiredNormalizedRotation - currentNormalizedRotation + 360) % 360;
  const extraTurns = 6 + Math.floor(Math.random() * 3);
  currentRotation += extraTurns * 360 + correction;
  canvas.style.transform = `rotate(${currentRotation}deg)`;
  window.setTimeout(() => {
    const selectedName = visibleName(wheelItems[winnerIndex]);
    result.textContent = selectedName;
    showWinner(selectedName);
    spinning = false;
    updateButton.disabled = false;
    shuffleButton.disabled = false;
    textarea.disabled = false;
  }, 5100);
}
canvas.addEventListener("click", spinWheel);
closeModal.addEventListener("click", hideWinner);
updateButton.addEventListener("click", () => { if (spinning) return; result.textContent = ""; syncWheelFromText(); drawWheel(); });
shuffleButton.addEventListener("click", () => { if (spinning || wheelItems.length < 2) return; result.textContent = ""; shuffleArray(wheelItems); drawWheel(); });
textarea.addEventListener("input", () => {
  if (spinning) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const original = textarea.value;
  const beforeStart = original.slice(0, start);
  const beforeEnd = original.slice(0, end);
  const converted = original.replaceAll(".", HIDDEN_RIG_MARKER);
  if (converted !== original) {
    textarea.value = converted;
    const newStart = beforeStart.replaceAll(".", HIDDEN_RIG_MARKER).length;
    const newEnd = beforeEnd.replaceAll(".", HIDDEN_RIG_MARKER).length;
    textarea.setSelectionRange(newStart, newEnd);
  }
  syncWheelFromText();
  drawWheel();
});
textarea.value = textarea.value.replaceAll(".", HIDDEN_RIG_MARKER);
syncWheelFromText();
drawWheel();
