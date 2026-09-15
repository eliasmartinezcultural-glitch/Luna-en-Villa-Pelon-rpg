const $ = id => document.getElementById(id);

/*
 * LUNA EN VILLA PELÓN — MOTOR BASE V1.1
 * LEYES MUNDIALES:
 * - RPG familiar de exploración, vida, paseo, misiones y aprendizaje.
 * - Se juega desde un enlace web, sin instalación ni descarga obligatoria.
 * - El núcleo debe funcionar en PC, tablet y móvil con recursos modestos.
 * - Villa Pelón es el único nombre territorial visible dentro del juego.
 * - Los datos históricos reales deben verificarse antes de presentarse como verdaderos.
 */

const SAVE_KEY = 'lunaVillaPelon';
const SAVE_VERSION = 3;
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
  worldTime: 8 * 60,
  player: { x: 480, y: 365 },
  explored: []
});

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return defaultState();
    const base = defaultState();
    return {
      ...base,
      ...raw,
      version: SAVE_VERSION,
      player: { ...base.player, ...(raw.player || {}) },
      memories: Array.isArray(raw.memories) ? raw.memories : [],
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

const obstacles = [
  { x: 0, y: 0, w: 3600, h: 80 }, { x: 0, y: 2320, w: 3600, h: 80 },
  { x: 0, y: 0, w: 80, h: 2400 }, { x: 3520, y: 0, w: 80, h: 2400 },
  { x: 350, y: 210, w: 250, h: 130 }, { x: 980, y: 230, w: 270, h: 150 },
  { x: 1450, y: 700, w: 300, h: 160 }, { x: 1750, y: 250, w: 250, h: 120 },
  { x: 600, y: 780, w: 180, h: 240 }, { x: 1280, y: 980, w: 260, h: 130 },
  { x: 2250, y: 900, w: 360, h: 180 }, { x: 2850, y: 430, w: 300, h: 150 },
  { x: 3050, y: 1500, w: 260, h: 220 }, { x: 1950, y: 1800, w: 420, h: 170 }
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
  if (screen === 'world') draw();
}

function save() {
  state.player = { x: Math.round(player.x), y: Math.round(player.y) };
  state.version = SAVE_VERSION;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    lastSaveAt = performance.now();
  } catch (_) {
    // El juego continúa aunque el almacenamiento del navegador esté bloqueado.
  }
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

function interact() {
  if (screen !== 'world' || paused) return;
  const n = nearNPC();
  if (!n) return;

  if (n.id === 'mateo' && !state.mission) {
    say([
      { speaker: 'Don Mateo', text: 'Llegaste justo cuando estaba buscando un recuerdo que guardé hace muchos años.' },
      { speaker: 'Don Mateo', text: 'No necesito que lo encuentres todo. Necesito que aprendas a mirar el pueblo.' },
      { speaker: 'Don Mateo', text: 'Hablá con Rosa y con Tomás. Ellos pueden darte las dos partes que faltan.' }
    ], 'mission');
  } else if (n.id === 'rosa' && state.mission && !state.rosa) {
    state.rosa = true; addMemory('rosa-pista'); save(); updateMission();
    say([
      { speaker: 'Rosa', text: 'Hay historias que se conservan en los caminos y en el trabajo cotidiano.' },
      { speaker: 'Rosa', text: 'Mi pista es sencilla: preguntate qué cosas hacen que un lugar sea reconocible para quienes lo habitan.' }
    ]);
  } else if (n.id === 'tomas' && state.mission && !state.tomas) {
    state.tomas = true; addMemory('tomas-pista'); save(); updateMission();
    say([
      { speaker: 'Tomás', text: 'Para mí, el territorio también se entiende por sus cambios: lo que hubo, lo que hay y lo que las personas construyeron.' },
      { speaker: 'Tomás', text: 'Llevá esas dos ideas a Don Mateo.' }
    ]);
  } else if (n.id === 'mateo' && state.mission && state.rosa && state.tomas && !state.reward) {
    state.reward = true; addMemory('primer-recuerdo'); save();
    $('objective').textContent = 'Misión completada';
    show('reward');
  } else if (n.id === 'rosa' || n.id === 'tomas') {
    say([{ speaker: n.name, text: 'Ya te di mi pista. Seguí recorriendo Villa Pelón.' }]);
  }
}

function updateMission() {
  if (!state.mission) {
    $('objective').textContent = 'Objetivo: conocé a Don Mateo';
  } else {
    $('objective').textContent = state.rosa && state.tomas
      ? 'Objetivo: volvé con Don Mateo'
      : 'Objetivo: encontrá las dos pistas';
  }
  $('rosaStep').textContent = (state.rosa ? '✓ ' : '○ ') + 'Rosa';
  $('tomasStep').textContent = (state.tomas ? '✓ ' : '○ ') + 'Tomás';
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
  if (!obstacles.some(o => rectHit(nx, player.y, player.r, o))) player.x = nx;
  if (!obstacles.some(o => rectHit(player.x, ny, player.r, o))) player.y = ny;
  player.x = Math.max(95, Math.min(world.w - 95, player.x));
  player.y = Math.max(95, Math.min(world.h - 95, player.y));
}

function draw() {
  const viewW = viewport.w;
  const viewH = viewport.h;
  camera.x = Math.max(0, Math.min(world.w - viewW, player.x - viewW / 2));
  camera.y = Math.max(0, Math.min(world.h - viewH, player.y - viewH / 2));

  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.fillStyle = '#71875b';
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.fillStyle = '#b7a36f'; ctx.fillRect(90, 610, 3420, 170);
  ctx.fillStyle = '#6687a0'; ctx.fillRect(3050, 80, 420, 2240);
  ctx.fillStyle = '#8b7658';
  for (let i = 0; i < 72; i++) {
    const x = 130 + (i * 97) % 3260;
    const y = 120 + (i * 173) % 2140;
    ctx.fillRect(x, y, 18, 8); ctx.fillRect(x + 5, y - 14, 8, 22);
  }

  ctx.strokeStyle = '#8f7b53'; ctx.lineWidth = 3;
  for (let x = 130; x < 3000; x += 360) {
    ctx.strokeRect(x, 840, 290, 360);
    ctx.strokeRect(x, 1280, 290, 360);
  }

  for (const o of obstacles) {
    ctx.fillStyle = '#4b4032'; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#655641'; ctx.fillRect(o.x + 8, o.y + 8, Math.max(0, o.w - 16), 18);
  }

  for (const n of npcs) {
    ctx.fillStyle = '#1b1813'; ctx.fillRect(n.x - 15, n.y - 12, 30, 36);
    ctx.fillStyle = n.color; ctx.fillRect(n.x - 12, n.y - 28, 24, 22);
    ctx.fillStyle = '#f5ecd8'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(n.name, n.x, n.y - 38);
  }

  ctx.fillStyle = '#e6d2a4';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#30271b'; ctx.fillRect(player.x - 7, player.y - 22, 14, 9);
  ctx.restore();

  const n = nearNPC();
  $('prompt').classList.toggle('hidden', !n);
}

function loop(t) {
  rafId = null;
  if (screen !== 'world' || paused) return;
  const dt = Math.min(0.035, (t - last) / 1000 || 0);
  last = t;
  move(dt);
  state.worldTime = (state.worldTime + dt * 2) % 1440;
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

function setKey(key, value) {
  keys[key] = value;
}

addEventListener('keydown', e => {
  setKey(e.key, true);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if ((e.key === 'e' || e.key === 'E') && !e.repeat) interact();
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
  localStorage.removeItem(SAVE_KEY);
  location.reload();
};

updateMission();
resizeCanvas();
