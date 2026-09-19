const $ = id => document.getElementById(id);

/* LUNA EN VILLA PELÓN — MOTOR CONSOLIDADO V1.2.0
 * Esta versión prioriza estabilidad, recuperación y compatibilidad web.
 */
const PRODUCT_VERSION = 'V1.2.0';
const SAVE_KEY = 'lunaVillaPelon';
const SAVE_VERSION = 4;
const AUTOSAVE_MS = 12000;
const screens = ['start', 'intro', 'world', 'dialogue', 'mission', 'reward'];
let screen = 'start';
let dialogueIndex = 0;
let dialogues = [];
let dialogueAfter = '';
let keys = Object.create(null);
let last = 0;
let rafId = null;
let paused = false;
let lastSaveAt = 0;

const defaultState = () => ({
  version: SAVE_VERSION,
  mission: false,
  rosa: false,
  tomas: false,
  reward: false,
  memories: [],
  inventory: [],
  explored: [],
  chapter: 1,
  mission2: false,
  mission2Done: false,
  mission3: false,
  mission3Done: false,
  worldTime: 8 * 60,
  player: { x: 480, y: 365 }
});

function safeNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return defaultState();
    const base = defaultState();
    return {
      ...base,
      ...raw,
      version: SAVE_VERSION,
      worldTime: Math.max(0, safeNumber(raw.worldTime, base.worldTime)),
      player: {
        x: safeNumber(raw.player?.x, base.player.x),
        y: safeNumber(raw.player?.y, base.player.y)
      },
      memories: Array.isArray(raw.memories) ? raw.memories : [],
      inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
      explored: Array.isArray(raw.explored) ? raw.explored : []
    };
  } catch (_) {
    return defaultState();
  }
}

let state = loadState();
const player = { x: state.player.x, y: state.player.y, r: 13, speed: 175 };
const world = { w: 3600, h: 2400 };
const camera = { x: 0, y: 0 };
const viewport = { w: 960, h: 540, dpr: 1 };

const npcs = [
  { id: 'mateo', name: 'Don Mateo', x: 530, y: 330, color: '#9a775c' },
  { id: 'rosa', name: 'Rosa', x: 780, y: 510, color: '#b66c78' },
  { id: 'tomas', name: 'Tomás', x: 1120, y: 410, color: '#6688a0' }
];

/* Base collision only protects the world boundary. rpg-v2 owns the real map solids. */
const obstacles = [
  { x: 0, y: 0, w: world.w, h: 80 },
  { x: 0, y: world.h - 80, w: world.w, h: 80 },
  { x: 0, y: 0, w: 80, h: world.h },
  { x: world.w - 80, y: 0, w: 80, h: world.h }
];

const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewport.w = w;
  viewport.h = h;
  viewport.dpr = dpr;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (screen === 'world' && typeof draw === 'function') draw();
}

function save() {
  state.player = { x: Math.round(player.x), y: Math.round(player.y) };
  state.version = SAVE_VERSION;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    lastSaveAt = performance.now();
  } catch (_) {}
}

function maybeAutosave(now) {
  if (now - lastSaveAt >= AUTOSAVE_MS) save();
}

function show(id) {
  screens.forEach(s => $(s)?.classList.remove('active'));
  $(id)?.classList.add('active');
  screen = id;
  if (id === 'world') {
    resizeCanvas();
    startLoop();
  } else {
    stopLoop();
  }
}

function startLoop() {
  if (paused || rafId !== null) return;
  last = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}

function startGame() { show('intro'); }

function enter() {
  player.x = state.player.x;
  player.y = state.player.y;
  paused = false;
  $('pause').classList.add('hidden');
  show('world');
  save();
}

function say(lines, after = '') {
  stopLoop();
  keys = Object.create(null);
  dialogues = lines;
  dialogueIndex = 0;
  dialogueAfter = after;
  show('dialogue');
  renderDialogue();
}

function renderDialogue() {
  const line = dialogues[dialogueIndex];
  if (!line) return;
  $('speaker').textContent = line.speaker;
  $('dialogueText').textContent = line.text;
  $('nextDialogue').textContent = dialogueIndex < dialogues.length - 1 ? 'Continuar' : 'Volver';
}

function next() {
  if (dialogueIndex < dialogues.length - 1) {
    dialogueIndex += 1;
    renderDialogue();
    return;
  }
  if (dialogueAfter === 'mission') updateMission();
  const destination = dialogueAfter || 'world';
  dialogueAfter = '';
  show(destination);
}

function nearNPC() {
  let best = null;
  let dist = Infinity;
  for (const n of npcs) {
    const d = Math.hypot(n.x - player.x, n.y - player.y);
    if (d < dist) { dist = d; best = n; }
  }
  return dist < 65 ? best : null;
}

function addMemory(id) {
  if (!state.memories.includes(id)) state.memories.push(id);
}

function updateMission() {
  const objective = $('objective');
  if (objective) {
    objective.textContent = !state.mission
      ? 'Objetivo: conocé a Don Mateo'
      : state.rosa && state.tomas
        ? 'Objetivo: volvé con Don Mateo'
        : 'Objetivo: encontrá las dos pistas';
  }
  if ($('rosaStep')) $('rosaStep').textContent = (state.rosa ? '✓ ' : '○ ') + 'Rosa';
  if ($('tomasStep')) $('tomasStep').textContent = (state.tomas ? '✓ ' : '○ ') + 'Tomás';
}

function acceptMission() {
  state.mission = true;
  save();
  updateMission();
  show('world');
}

function rectHit(x, y, r, o) {
  const nx = Math.max(o.x, Math.min(x, o.x + o.w));
  const ny = Math.max(o.y, Math.min(y, o.y + o.h));
  return (x - nx) ** 2 + (y - ny) ** 2 < r * r;
}

function move(dt) {
  if (paused || screen !== 'world') return;
  let dx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  let dy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (!dx && !dy) return;
  const len = Math.hypot(dx, dy);
  dx = dx / len * player.speed * dt;
  dy = dy / len * player.speed * dt;
  const nx = player.x + dx;
  const ny = player.y + dy;
  const blocked = typeof window.worldBlocked === 'function' ? window.worldBlocked : (x, y, r) => obstacles.some(o => rectHit(x, y, r, o));
  if (!blocked(nx, player.y, player.r)) player.x = nx;
  if (!blocked(player.x, ny, player.r)) player.y = ny;
  player.x = Math.max(95, Math.min(world.w - 95, player.x));
  player.y = Math.max(95, Math.min(world.h - 95, player.y));
}

function draw() {
  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  ctx.clearRect(0, 0, viewport.w, viewport.h);
  ctx.fillStyle = '#71875b';
  ctx.fillRect(0, 0, viewport.w, viewport.h);
}

function loop(t) {
  rafId = null;
  if (screen !== 'world' || paused) return;
  const dt = Math.min(0.035, (t - last) / 1000 || 0);
  last = t;
  move(dt);
  /* worldTime is intentionally unbounded: day/night, weather and seasons need elapsed days. */
  state.worldTime = Math.max(0, state.worldTime + dt * 2);
  draw();
  maybeAutosave(t);
  rafId = requestAnimationFrame(loop);
}

function togglePause(force) {
  if (screen !== 'world' && !paused) return;
  const nextPaused = typeof force === 'boolean' ? force : !paused;
  paused = nextPaused;
  $('pause').classList.toggle('hidden', !paused);
  if (paused) {
    keys = Object.create(null);
    stopLoop();
    save();
  } else {
    startLoop();
  }
}

function setKey(key, value) { keys[key] = value; }

addEventListener('keydown', e => {
  setKey(e.key, true);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if ((e.key === 'e' || e.key === 'E') && !e.repeat) window.interact?.();
  if (e.key === 'Escape' && !e.repeat) togglePause();
});
addEventListener('keyup', e => setKey(e.key, false));
addEventListener('blur', () => {
  keys = Object.create(null);
  if (screen === 'world' && !paused) togglePause(true);
});
addEventListener('resize', resizeCanvas, { passive: true });
addEventListener('orientationchange', () => setTimeout(resizeCanvas, 80), { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    keys = Object.create(null);
    if (screen === 'world' && !paused) togglePause(true);
  }
});

for (const b of document.querySelectorAll('.touch button')) {
  const release = () => setKey(b.dataset.key, false);
  b.addEventListener('pointerdown', e => {
    e.preventDefault();
    b.setPointerCapture?.(e.pointerId);
    setKey(b.dataset.key, true);
  });
  b.addEventListener('pointerup', release);
  b.addEventListener('pointercancel', release);
  b.addEventListener('lostpointercapture', release);
}

$('startBtn').onclick = startGame;
$('enterBtn').onclick = enter;
$('nextDialogue').onclick = next;
$('acceptMission').onclick = acceptMission;
$('closeReward').onclick = () => { show('world'); updateMission(); save(); };
$('pauseBtn').onclick = () => togglePause();
$('resume').onclick = () => togglePause(false);
$('restart').onclick = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('lunaOnboardingV1');
  } catch (_) {}
  location.reload();
};

updateMission();
resizeCanvas();