const $ = id => document.getElementById(id);

/*
 * LUNA EN VILLA PELÓN — MOTOR BASE V1
 * LEY MUNDIAL INVIOLABLE:
 * Este es un juego familiar RPG de exploración, vida, paseo, misiones y aprendizaje.
 * Toda expansión debe conservar ese foco. La educación ocurre jugando y explorando,
 * no convirtiendo el juego en una clase. Villa Pelón es el único nombre territorial
 * visible dentro del juego. Los datos históricos reales deben verificarse antes de
 * convertirse en contenido presentado como verdadero.
 */

const SAVE_KEY = 'lunaVillaPelon';
const SAVE_VERSION = 2;
const screens = ['start','intro','world','dialogue','mission','reward'];
let screen = 'start';
let dialogueIndex = 0;
let dialogues = [];
let dialogueAfter = '';
let keys = {};
let last = 0;
let rafId = null;
let paused = false;

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
    return {
      ...defaultState(),
      ...raw,
      version: SAVE_VERSION,
      player: {...defaultState().player, ...(raw.player || {})},
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

const npcs = [
  {id:'mateo', name:'Don Mateo', x:530, y:330, color:'#9a775c'},
  {id:'rosa', name:'Rosa', x:780, y:510, color:'#b66c78'},
  {id:'tomas', name:'Tomás', x:1120, y:410, color:'#6688a0'}
];

const obstacles = [
  {x:0,y:0,w:3600,h:80}, {x:0,y:2320,w:3600,h:80},
  {x:0,y:0,w:80,h:2400}, {x:3520,y:0,w:80,h:2400},
  {x:350,y:210,w:250,h:130}, {x:980,y:230,w:270,h:150},
  {x:1450,y:700,w:300,h:160}, {x:1750,y:250,w:250,h:120},
  {x:600,y:780,w:180,h:240}, {x:1280,y:980,w:260,h:130},
  {x:2250,y:900,w:360,h:180}, {x:2850,y:430,w:300,h:150},
  {x:3050,y:1500,w:260,h:220}, {x:1950,y:1800,w:420,h:170}
];

const canvas = $('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function save() {
  state.player = {x: player.x, y: player.y};
  state.version = SAVE_VERSION;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function show(id) {
  screens.forEach(s => $(s).classList.remove('active'));
  if ($(id)) $(id).classList.add('active');
  screen = id;
  if (id === 'world') startLoop();
}

function startLoop() {
  if (rafId !== null) return;
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
}

function say(lines, after = '') {
  stopLoop();
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
    dialogueIndex++;
    renderDialogue();
    return;
  }
  if (dialogueAfter === 'mission') updateMission();
  show(dialogueAfter || 'world');
  dialogueAfter = '';
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
      {speaker:'Don Mateo', text:'Llegaste justo cuando estaba buscando un recuerdo que guardé hace muchos años.'},
      {speaker:'Don Mateo', text:'No necesito que lo encuentres todo. Necesito que aprendas a mirar el pueblo.'},
      {speaker:'Don Mateo', text:'Hablá con Rosa y con Tomás. Ellos pueden darte las dos partes que faltan.'}
    ], 'mission');
  } else if (n.id === 'rosa' && state.mission && !state.rosa) {
    state.rosa = true; addMemory('rosa-pista'); save(); updateMission();
    say([
      {speaker:'Rosa', text:'Hay historias que se conservan en los caminos y en el trabajo cotidiano.'},
      {speaker:'Rosa', text:'Mi pista es sencilla: preguntate qué cosas hacen que un lugar sea reconocible para quienes lo habitan.'}
    ]);
  } else if (n.id === 'tomas' && state.mission && !state.tomas) {
    state.tomas = true; addMemory('tomas-pista'); save(); updateMission();
    say([
      {speaker:'Tomás', text:'Para mí, el territorio también se entiende por sus cambios: lo que hubo, lo que hay y lo que las personas construyeron.'},
      {speaker:'Tomás', text:'Llevá esas dos ideas a Don Mateo.'}
    ]);
  } else if (n.id === 'mateo' && state.mission && state.rosa && state.tomas && !state.reward) {
    state.reward = true; addMemory('primer-recuerdo'); save();
    $('objective').textContent = 'Misión completada';
    show('reward');
  } else if (n.id === 'rosa' || n.id === 'tomas') {
    say([{speaker:n.name, text:'Ya te di mi pista. Seguí recorriendo Villa Pelón.'}]);
  }
}

function updateMission() {
  if (!state.mission) {
    $('objective').textContent = 'Objetivo: conocé a Don Mateo';
    return;
  }
  $('objective').textContent = state.rosa && state.tomas
    ? 'Objetivo: volvé con Don Mateo'
    : 'Objetivo: encontrá las dos pistas';
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
  camera.x = Math.max(0, Math.min(world.w - canvas.width, player.x - canvas.width / 2));
  camera.y = Math.max(0, Math.min(world.h - canvas.height, player.y - canvas.height / 2));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#71875b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Territorio base: pueblo, camino principal, agua y exterior.
  ctx.fillStyle = '#b7a36f'; ctx.fillRect(90, 610, 3420, 170);
  ctx.fillStyle = '#6687a0'; ctx.fillRect(3050, 80, 420, 2240);
  ctx.fillStyle = '#8b7658';
  for (let i = 0; i < 72; i++) {
    const x = 130 + (i * 97) % 3260;
    const y = 120 + (i * 173) % 2140;
    ctx.fillRect(x, y, 18, 8); ctx.fillRect(x + 5, y - 14, 8, 22);
  }

  // Chacras / parcelas visuales simples.
  ctx.strokeStyle = '#8f7b53'; ctx.lineWidth = 3;
  for (let x = 130; x < 3000; x += 360) {
    ctx.strokeRect(x, 840, 290, 360);
    ctx.strokeRect(x, 1280, 290, 360);
  }

  for (const o of obstacles) {
    ctx.fillStyle = '#4b4032'; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#655641'; ctx.fillRect(o.x + 8, o.y + 8, Math.max(0,o.w - 16), 18);
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
  rafId = requestAnimationFrame(loop);
}

function togglePause() {
  if (screen !== 'world' && !paused) return;
  paused = !paused;
  $('pause').classList.toggle('hidden', !paused);
  if (paused) {
    stopLoop();
    save();
  } else {
    show('world');
  }
}

addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if (e.key === 'e' || e.key === 'E') interact();
  if (e.key === 'Escape') togglePause();
});
addEventListener('keyup', e => { keys[e.key] = false; });

addEventListener('blur', () => {
  keys = {};
  if (screen === 'world' && !paused) togglePause();
});

for (const b of document.querySelectorAll('.touch button')) {
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); keys[b.dataset.key] = true; });
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { keys[b.dataset.key] = false; }));
}

$('startBtn').onclick = startGame;
$('enterBtn').onclick = enter;
$('nextDialogue').onclick = next;
$('acceptMission').onclick = acceptMission;
$('closeReward').onclick = () => { show('world'); updateMission(); };
$('pauseBtn').onclick = togglePause;
$('resume').onclick = togglePause;
$('restart').onclick = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };

updateMission();
