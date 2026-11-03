// عالم المغامرات – العوالم الستة (كل واحد: الشكل، المناطق، الأسئلة، الجوائز)
import * as THREE from './three.module.js';
import { mat, makeAnimal, starGeometry } from './characters.js?v=7';
import { rand, groundY } from './world.js?v=7';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// نفس التصميم ف كل العوالم: 3 مناطق (ولا 5) + الكنز
const POS = { a: V3(-13, 0, -3), b: V3(13, 0, -3), c: V3(0, 0, -13), d: V3(-15.5, 0, 10), e: V3(15.5, 0, 10) };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const mesh = (geo, m, x = 0, y = 0, z = 0, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; if (parent) parent.add(o); return o; };

// ================================================= لوحة فيها رسم (إيموجي / رقم / عدد / سهم)
const EMOJI = {
  fish: '🐟', octopus: '🐙', crab: '🦀', whale: '🐳', dolphin: '🐬', shark: '🦈',
  shell: '🐚', squid: '🦑', seaturtle: '🐢', lobster: '🦞', puffer: '🐡', penguin: '🐧',
  sun: '☀️', moon: '🌙', earth: '🌍', star: '⭐', rocket: '🚀', comet: '☄️',
  trex: '🦖', longneck: '🦕', croc: '🐊', lizard: '🦎', volcano: '🌋', bone: '🦴',
  cow: '🐄', sheep: '🐑', dog: '🐕', cat: '🐈', chicken: '🐔', duck: '🦆',
  cook: '👨‍🍳', doctor: '👩‍⚕️', police: '👮', firefighter: '👨‍🚒', farmer: '👨‍🌾', teacher: '👩‍🏫',
  pan: '🍳', stetho: '🩺', policecar: '🚓', firetruck: '🚒', tractor: '🚜', books: '📚',
  camel: '🐪', mosque: '🕌', palm: '🌴', orangefruit: '🍊', tea: '🍵', drum: '🥁',
  apple: '🍎', banana: '🍌', grapes: '🍇', strawberry: '🍓', watermelon: '🍉', pineapple: '🍍',
  lion: '🦁', tiger: '🐅', zebra: '🦓', gorilla: '🦍', hippo: '🦛', snake: '🐍',
  butterfly: '🦋', bee: '🐝', ladybug: '🐞', ant: '🐜', snail: '🐌', caterpillar: '🐛',
  carrot: '🥕', honey: '🍯', bamboo: '🎋', cheese: '🧀',
  polarbear: '🐻‍❄️', seal: '🦭', fox: '🦊', owl: '🦉', reindeer: '🦌',
  scarf: '🧣', gloves: '🧤', coat: '🧥', boot: '🥾', socks: '🧦', skis: '🎿',
  snow: '❄️', rain: '🌧️', wind: '🌬️', cloud: '☁️', rainbow: '🌈',
};
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Android Emoji",sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function tileTexture(draw, bg, border) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = border; ctx.fillRect(0, 0, 256, 256);
  roundRect(ctx, 12, 12, 232, 232, 30); ctx.fillStyle = bg; ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const drawEmoji = (em, size = 170) => ctx => { ctx.font = `${size}px ${EMOJI_FONT}`; ctx.fillText(em, 128, 140); };
const drawDigit = (n, col) => ctx => {
  ctx.font = `900 190px "Arial Rounded MT Bold","Arial Black",Tajawal,sans-serif`;
  ctx.lineWidth = 14; ctx.strokeStyle = '#ffffff'; ctx.strokeText(String(n), 128, 140);
  ctx.fillStyle = col; ctx.fillText(String(n), 128, 140);
};
const GRID = { 1: [[0, 0]], 2: [[-1, 0], [1, 0]], 3: [[-1, -1], [1, -1], [0, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]] };
const drawCount = (n, em) => ctx => {
  const pts = GRID[n]; const big = n <= 2 ? 92 : 70; const sx = n === 6 ? 70 : 62, sy = 58;
  ctx.font = `${big}px ${EMOJI_FONT}`;
  for (const [x, y] of pts) ctx.fillText(em, 128 + x * sx, 134 + y * sy);
};
const ARROW = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };
const drawArrow = dir => ctx => {
  ctx.save(); ctx.translate(128, 128); ctx.rotate(ARROW[dir]);
  ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(70, -10); ctx.lineTo(28, -10); ctx.lineTo(28, 84); ctx.lineTo(-28, 84); ctx.lineTo(-28, -10); ctx.lineTo(-70, -10); ctx.closePath();
  ctx.fillStyle = '#7b2cbf'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
};

// لوحة فوق عمود صغير
export function makeTile(draw, o = {}) {
  const root = new THREE.Group(); const g = new THREE.Group(); root.add(g);
  const size = (o.size || 1) * 1.75;
  const pedH = o.pedH ?? 0.8;
  const ped = mesh(new THREE.CylinderGeometry(0.5, 0.65, pedH, 12), mat(o.ped || '#ffffff', { roughness: 0.7 }), 0, pedH / 2, 0, g);
  ped.receiveShadow = true;
  const tex = tileTexture(draw, o.bg || '#ffffff', o.border || '#ffd23f');
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
  const side = mat(o.border || '#ffd23f');
  const tileG = new THREE.Group(); tileG.position.y = pedH + size / 2 + 0.12; g.add(tileG);
  const tile = new THREE.Mesh(new THREE.BoxGeometry(size, size, 0.16), [side, side, side, side, front, side]);
  tile.castShadow = true; tileG.add(tile);
  const obj = { root, jump: 0, happy: 0, flat: true };
  const ph = Math.random() * 6;
  obj.update = (dt, t) => {
    tileG.rotation.y = Math.sin(t * 0.8 + ph) * 0.12;
    tileG.rotation.z = 0;
    let y = Math.sin(t * 1.6 + ph) * 0.06;
    if (obj.jump > 0) { obj.jump -= dt; y += Math.sin((1 - obj.jump / 0.5) * Math.PI) * 0.3; }
    if (obj.happy > 0) { obj.happy -= dt; tileG.rotation.z = Math.sin(t * 14) * 0.25; y += Math.abs(Math.sin(t * 8)) * 0.35; }
    g.position.y = y;
  };
  return obj;
}
const emojiTile = (o = {}) => key => makeTile(drawEmoji(EMOJI[key]), o);
const num = k => +k.slice(1);

// كوكب 3D (للأحجام ف الفضاء)
function makePlanet(r, color, ring) {
  const root = new THREE.Group(); const g = new THREE.Group(); root.add(g);
  const ped = mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.6, 12), mat('#8a8fa8'), 0, 0.3, 0, g);
  ped.receiveShadow = true;
  const pl = new THREE.Group(); pl.position.y = 0.6 + r + 0.15; g.add(pl);
  mesh(new THREE.SphereGeometry(r, 32, 24), mat(color, { emissive: color, emissiveIntensity: 0.25 }), 0, 0, 0, pl);
  for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(r * 0.18, 12, 8), mat('#ffffff', { transparent: true, opacity: 0.35 }), Math.cos(i * 2) * r * 0.7, Math.sin(i * 1.3) * r * 0.5, r * 0.62, pl);
  if (ring) { const rg = mesh(new THREE.TorusGeometry(r * 1.5, r * 0.08, 8, 40), mat('#ffe8a3'), 0, 0, 0, pl); rg.rotation.x = 1.2; }
  const obj = { root, jump: 0, happy: 0 };
  const ph = Math.random() * 6;
  obj.update = (dt, t) => {
    pl.rotation.y = t * 0.6 + ph;
    let y = Math.sin(t * 1.5 + ph) * 0.08;
    if (obj.jump > 0) { obj.jump -= dt; y += Math.sin((1 - obj.jump / 0.5) * Math.PI) * 0.3; }
    if (obj.happy > 0) { obj.happy -= dt; y += Math.abs(Math.sin(t * 8)) * 0.4; }
    g.position.y = y;
  };
  return obj;
}

// ================================================= أسئلة عامة
const askBigSmall = () => { const goal = pick(['big', 'small']); return { goal, line: goal === 'big' ? 'ask_big' : 'ask_small' }; };
const sizeWrong = () => null; // غير "عاود"

// ================================================= الجزيرة (العالم 1)
export function makeFlower(color) {
  const root = new THREE.Group(); const g = new THREE.Group(); root.add(g);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), mat('#3a9d3a')); stem.position.y = 0.8; g.add(stem);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), mat('#4caf50')); l.scale.set(0.25, 0.05, 0.12); l.position.set(s * 0.22, 0.6, 0); l.rotation.z = s * 0.4; g.add(l); }
  const head = new THREE.Group(); head.position.y = 1.7; head.rotation.x = -0.35; g.add(head);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat(color));
    p.scale.set(0.28, 0.14, 0.08); p.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0); p.rotation.z = a; head.add(p);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat('#fff3b0')); c.position.z = 0.05; head.add(c);
  // وجه ضاحك صغير
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat('#222')); e.position.set(s * 0.06, 0.04, 0.2); head.add(e); }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const obj = { root, jump: 0, happy: 0 };
  const ph = Math.random() * 6;
  obj.update = (dt, t) => {
    head.rotation.z = Math.sin(t * 1.5 + ph) * 0.15;
    let y = 0, sc = 1;
    if (obj.jump > 0) { obj.jump -= dt; y = Math.sin((1 - obj.jump / 0.5) * Math.PI) * 0.3; }
    if (obj.happy > 0) { obj.happy -= dt; sc = 1 + Math.abs(Math.sin(t * 10)) * 0.25; head.rotation.y = t * 6; } else head.rotation.y = 0;
    g.position.y = y; g.scale.setScalar(sc);
  };
  return obj;
}

export function makeStone(shape) {
  const root = new THREE.Group(); const g = new THREE.Group(); root.add(g);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 1.1, 8), mat('#8d93a0', { roughness: 0.85 })); st.position.y = 0.55; st.castShadow = true; g.add(st);
  const glowM = mat('#7bdff2', { emissive: '#3ac7ff', emissiveIntensity: 0.9 });
  let sym;
  // أشكال مسطحة (2D سميكة) باش الطفل يعرفها مزيان: دائرة، مربع، مثلث، نجمة
  const flat = (sh) => { const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 32 }); geo.center(); return geo; };
  let geo, col, em;
  if (shape === 'circle') { const sh = new THREE.Shape(); sh.absarc(0, 0, 0.45, 0, Math.PI * 2, false); geo = flat(sh); col = '#ff6b6b'; em = '#ff3b3b'; }
  else if (shape === 'square') { const sh = new THREE.Shape(); sh.moveTo(-0.42, -0.42); sh.lineTo(0.42, -0.42); sh.lineTo(0.42, 0.42); sh.lineTo(-0.42, 0.42); sh.closePath(); geo = flat(sh); col = '#4dabf7'; em = '#1c7ed6'; }
  else if (shape === 'triangle') { const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.55, -0.42); sh.lineTo(-0.55, -0.42); sh.closePath(); geo = flat(sh); col = '#51cf66'; em = '#2f9e44'; }
  else { geo = starGeometry(0.55, 0.24, 0.2); col = '#ffd43b'; em = '#fab005'; }
  sym = new THREE.Mesh(geo, mat(col, { emissive: em, emissiveIntensity: 0.55 }));
  sym.position.y = 1.75; sym.castShadow = true; g.add(sym);
  const glow = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 32), glowM); glow.rotation.x = Math.PI / 2; glow.position.y = 1.12; g.add(glow);
  const obj = { root, jump: 0, happy: 0 };
  const ph = Math.random() * 6;
  obj.update = (dt, t) => {
    sym.rotation.z = 0;
    sym.rotation.y = Math.sin(t * 0.9 + ph) * 0.3; // كيتمايل شوية، ديما باين من القدام
    sym.position.y = 1.75 + Math.sin(t * 2 + ph) * 0.08;
    let y = 0;
    if (obj.jump > 0) { obj.jump -= dt; y = Math.sin((1 - obj.jump / 0.5) * Math.PI) * 0.25; }
    if (obj.happy > 0) { obj.happy -= dt; sym.rotation.z = Math.sin(t * 12) * 0.3; y = Math.abs(Math.sin(t * 8)) * 0.3; }
    g.position.y = y;
  };
  return obj;
}


const FLOWER_COLORS = { red: '#e63946', blue: '#3a86ff', yellow: '#ffd60a', green: '#38b000', purple: '#9d4edd', orange: '#fb8500' };

const island = {
  id: 'island', medal: 'island', hat: 'explorer', questChest: 'quest2', questDone: 'quest3',
  theme: { bg: '#8fd3ff', fog: '#c4ecff', sea: '#25b4d8', rim: '#f3d999', ground: '#78c45c', patch: '#8fd46e' },
  lines: { welcome: 'loulou_welcome', mission: 'loulou_mission', allKeys: 'all_keys', chestOpen: 'chest_open', chat: ['bibo_chat_1', 'bibo_chat_2', 'bibo_chat_3'] },
  order: ['animals', 'flowers', 'stones', 'fruits', 'coconuts'],
  zones: {
    fruits: { pos: POS.d, ring: '#ff6b6b', floor: '#f6e7b4', items: ['apple', 'banana', 'grapes', 'strawberry', 'watermelon', 'pineapple'], line: 'tap_animal', intro: 'fruits_intro', wrong: 'you_chose', hello: k => ['look_x', k],
      make: emojiTile({ ped: '#fff3d6', border: '#ff6b6b', bg: '#fffaf0' }) },
    coconuts: { pos: POS.e, ring: '#c08552', floor: '#f6e7b4', items: ['n2', 'n3', 'n4', 'n5', 'n6'], line: 'ask_coco', intro: 'coconuts_intro', wrong: 'count_is', hello: k => ['count_is', k],
      make: key => makeTile(drawCount(num(key), '🥥'), { ped: '#fff3d6', border: '#c08552', bg: '#fffaf0' }) },
    animals: { pos: POS.a, ring: '#ffd166', items: ['elephant', 'giraffe', 'monkey', 'turtle', 'rabbit', 'parrot'], line: 'tap_animal', intro: 'animals_intro', wrong: 'this_is', hello: k => ['animal_hello', k],
      make: key => { const an = makeAnimal(key); an.root.scale.setScalar(key === 'giraffe' ? 0.75 : key === 'elephant' ? 0.85 : 1.1); return an; } },
    flowers: { pos: POS.b, ring: '#ff8fab', items: ['red', 'blue', 'yellow', 'green', 'purple', 'orange'], line: 'tap_color', intro: 'flowers_intro', wrong: 'this_is_flower', hello: k => ['this_is_flower', k],
      make: key => makeFlower(FLOWER_COLORS[key]) },
    stones: { pos: POS.c, ring: '#a0c4ff', floor: '#cfc6b4', spread: 1.6, items: ['circle', 'square', 'triangle', 'star'], line: 'tap_shape', intro: 'stones_intro', wrong: 'this_is', hello: k => ['this_is', k],
      make: key => makeStone(key) },
  },
  decor(w) {
    const sc = w.scene;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#6aab52'));
    hill.scale.set(1.4, 0.75, 0.7); hill.position.set(0, 0, -26.5); hill.receiveShadow = true; hill.castShadow = true; sc.add(hill);
    const cave = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.8, 12, 24, Math.PI), mat('#8d8f99'));
    cave.position.set(0, 0, -21.6); cave.castShadow = true; sc.add(cave);
    const caveHole = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24, 0, Math.PI), mat('#2a2230'));
    caveHole.position.set(0, 0.05, -21.8); sc.add(caveHole);
    w.obstacles.push({ x: 0, z: -24.5, r: 5.5 });
    let placed = 0, tries = 0;
    while (placed < 22 && tries < 400) {
      tries++;
      const a = rand(0, Math.PI * 2), r = rand(17, 28.5);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (w.nearZone(x, z, 8) || Math.hypot(x - w.CHEST.x, z - w.CHEST.z) < 6 || Math.hypot(x - w.SPAWN.x, z - w.SPAWN.z) < 6 || z < -17) continue;
      w.addPalm(x, z); placed++;
    }
    for (let i = 0; i < 30; i++) {
      const a = rand(0, Math.PI * 2), r = rand(4, 23);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (w.nearZone(x, z, 6.5) || Math.hypot(x - w.SPAWN.x, z - w.SPAWN.z) < 4) continue;
      if (i % 3 === 0) w.addRock(x, z); else w.addBush(x, z);
    }
  },
};

// ================================================= مملكة الحلوى 🍭 (الأرقام و الحساب)
const CANDY_COLS = ['#ff5fa2', '#ffd23f', '#4cc9f0', '#80ed99', '#c77dff', '#ff8c42'];
const candyTile = { ped: '#fff0f6', border: '#ff5fa2', bg: '#fffafc' };
const candy = {
  id: 'candy', medal: 'candy', hat: 'party', questChest: 'quest2b', questDone: 'quest3b',
  theme: { bg: '#ffd6ec', fog: '#ffe8f4', fogNear: 60, fogFar: 150, sea: '#ff9ec7', rim: '#f6d7a7', ground: '#ffc2dc', patch: '#ffd9ea', sky: '#fff0f8', groundLight: '#e7a6c4' },
  lines: { welcome: 'candy_welcome', mission: 'candy_mission', allKeys: 'all_keys_go', chestOpen: 'candy_chest', chat: ['candy_chat_1', 'candy_chat_2', 'bibo_chat_2'] },
  order: ['numbers', 'count', 'add'],
  zones: {
    numbers: { pos: POS.a, ring: '#ff5fa2', floor: '#fff3d6', items: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'], line: 'ask_number', intro: 'candy_numbers_intro', wrong: 'this_is_number', hello: k => ['look_x', k],
      make: (key, w, i) => makeTile(drawDigit(num(key), CANDY_COLS[i % 6]), candyTile) },
    count: { pos: POS.b, ring: '#ffd23f', floor: '#fff3d6', items: ['n2', 'n3', 'n4', 'n5', 'n6'], line: 'ask_count', intro: 'candy_count_intro', wrong: 'count_is', hello: k => ['count_is', k],
      make: key => makeTile(drawCount(num(key), '🍬'), { ped: '#fff0f6', border: '#ffd23f', bg: '#fffbe6' }) },
    add: { pos: POS.c, ring: '#4cc9f0', floor: '#fff3d6', items: ['n2', 'n3', 'n4', 'n5', 'n6'], intro: 'candy_add_intro', wrong: 'this_is_number', hello: k => ['look_x', k],
      ask: (pz) => { const s = pick([2, 3, 4, 5, 6].filter(v => 'n' + v !== pz.last)); const a = 1 + Math.floor(Math.random() * (s - 1)); return { goal: 'n' + s, line: 'ask_add', x: { a: 'n' + a, b: 'n' + (s - a) } }; },
      make: (key, w, i) => makeTile(drawDigit(num(key), CANDY_COLS[(i + 2) % 6]), { ped: '#fff0f6', border: '#4cc9f0', bg: '#f2fbff' }) },
  },
  decor(w) {
    // مصاصات كبار
    w.scatter(9, 15, 28, (i) => {
      const g = new THREE.Group(); const h = rand(3, 5);
      mesh(new THREE.CylinderGeometry(0.12, 0.12, h, 8), mat('#ffffff'), 0, h / 2, 0, g);
      const head = new THREE.Group(); head.position.y = h + 0.9; g.add(head);
      mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 32), mat(CANDY_COLS[i % 6]), 0, 0, 0, head).rotation.x = Math.PI / 2;
      for (let k = 0; k < 3; k++) mesh(new THREE.TorusGeometry(0.3 + k * 0.28, 0.07, 8, 32), mat('#ffffff'), 0, 0, 0.16, head);
      g.rotation.y = rand(0, 6);
      return g;
    }, 0.5);
    // كب كيك
    w.scatter(7, 6, 24, (i) => {
      const g = new THREE.Group();
      mesh(new THREE.CylinderGeometry(0.8, 0.55, 0.9, 16), mat(['#c77dff', '#4cc9f0', '#ffd23f'][i % 3]), 0, 0.45, 0, g);
      const f = mesh(new THREE.SphereGeometry(0.85, 20, 14), mat('#fff0f6'), 0, 1.05, 0, g); f.scale.y = 0.7;
      mesh(new THREE.SphereGeometry(0.2, 12, 10), mat('#e63946'), 0, 1.7, 0, g);
      return g;
    }, 0.9);
    // حلوى الجيلي
    w.scatter(14, 4, 24, (i) => {
      const g = new THREE.Group();
      const d = mesh(new THREE.SphereGeometry(0.55, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(CANDY_COLS[(i + 3) % 6], { roughness: 0.15, metalness: 0.1 }), 0, 0, 0, g);
      d.scale.y = 1.1; return g;
    }, 0.6);
    // دونات كبار واقفين
    w.scatter(4, 18, 27, (i) => {
      const g = new THREE.Group();
      mesh(new THREE.TorusGeometry(1.3, 0.6, 16, 32), mat('#e9b872'), 0, 1.9, 0, g);
      const ic = mesh(new THREE.TorusGeometry(1.3, 0.62, 16, 32, Math.PI), mat(CANDY_COLS[i % 6]), 0, 1.9, 0.05, g); ic.scale.z = 0.6;
      g.rotation.y = rand(0, 6); return g;
    }, 1.4);
  },
};

// ================================================= أعماق البحار 🐠
const seaTile = { ped: '#ffd6a5', border: '#48cae4', bg: '#eafaff' };
const sea = {
  id: 'sea', medal: 'sea', hat: 'sailor', questChest: 'quest2b', questDone: 'quest3b',
  theme: { bg: '#0e5a96', fog: '#1874b0', fogNear: 25, fogFar: 85, rim: '#d9c48f', ground: '#f1dfaa', patch: '#e6cf8f', sky: '#8fe3ff', groundLight: '#2a6f97', hemi: 1.5, sun: '#bff3ff', sunI: 2 },
  lines: { welcome: 'sea_welcome', mission: 'sea_mission', allKeys: 'all_keys_go', chestOpen: 'sea_chest', chat: ['sea_chat_1', 'sea_chat_2', 'bibo_chat_2'] },
  order: ['sea1', 'sea2', 'fishcount'],
  zones: {
    sea1: { pos: POS.a, ring: '#48cae4', floor: '#fbeecb', items: ['fish', 'octopus', 'crab', 'whale', 'dolphin', 'shark'], line: 'tap_animal', intro: 'sea1_intro', wrong: 'you_chose', hello: k => ['animal_hello', k], make: emojiTile(seaTile) },
    sea2: { pos: POS.b, ring: '#ff8fab', floor: '#fbeecb', items: ['shell', 'squid', 'seaturtle', 'lobster', 'puffer', 'penguin'], line: 'tap_animal', intro: 'sea2_intro', wrong: 'you_chose', hello: k => ['animal_hello', k], make: emojiTile({ ...seaTile, border: '#ff8fab' }) },
    fishcount: { pos: POS.c, ring: '#ffd23f', floor: '#fbeecb', items: ['n2', 'n3', 'n4', 'n5', 'n6'], line: 'ask_fish', intro: 'fishcount_intro', wrong: 'count_is', hello: k => ['count_is', k],
      make: key => makeTile(drawCount(num(key), '🐠'), { ...seaTile, border: '#ffd23f' }) },
  },
  decor(w) {
    const coralCols = ['#ff6b6b', '#ff9f43', '#f368e0', '#feca57', '#ff8fab'];
    // المرجان
    w.scatter(16, 6, 28, (i) => {
      const g = new THREE.Group(); const c = mat(coralCols[i % 5]);
      for (let k = 0; k < 5; k++) { const h = rand(0.8, 2); const b = mesh(new THREE.CylinderGeometry(0.1, 0.16, h, 8), c, rand(-0.4, 0.4), h / 2, rand(-0.4, 0.4), g); b.rotation.set(rand(-0.4, 0.4), 0, rand(-0.4, 0.4)); mesh(new THREE.SphereGeometry(0.16, 8, 6), c, b.position.x, h, b.position.z, g); }
      return g;
    }, 0.8);
    // الطحالب كتتمايل
    const weeds = [];
    w.scatter(22, 4, 29, () => {
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) { const h = rand(1.5, 3.5); const s = mesh(new THREE.BoxGeometry(0.12, h, 0.12), mat(k % 2 ? '#2d9d5a' : '#40c27a'), rand(-0.3, 0.3), h / 2, rand(-0.3, 0.3), g); s.geometry.translate(0, 0, 0); weeds.push(s); }
      return g;
    }, 0);
    w.tick((dt, t) => { weeds.forEach((s, i) => { s.rotation.z = Math.sin(t * 1.2 + i) * 0.18; s.rotation.x = Math.cos(t * 0.9 + i) * 0.12; }); });
    // صخور و صدف
    w.scatter(10, 5, 27, () => { const g = new THREE.Group(); const r = mesh(new THREE.DodecahedronGeometry(rand(0.6, 1.2), 0), mat('#8395a7', { roughness: 0.9 }), 0, 0.3, 0, g); r.rotation.set(rand(0, 3), rand(0, 3), 0); return g; }, 0.9);
    // حوت كبير كيعوم بعيد و أسماك صغار
    const school = new THREE.Group(); w.scene.add(school);
    const fcols = ['#ffd23f', '#ff6b6b', '#4cc9f0', '#ff9f43'];
    const fishes = [];
    for (let i = 0; i < 18; i++) {
      const f = new THREE.Group();
      const b = mesh(new THREE.SphereGeometry(0.3, 12, 8), mat(fcols[i % 4]), 0, 0, 0, f); b.scale.set(1.4, 0.8, 0.5);
      const tl = mesh(new THREE.ConeGeometry(0.22, 0.35, 4), mat(fcols[i % 4]), -0.5, 0, 0, f); tl.rotation.z = Math.PI / 2;
      fishes.push({ f, r: rand(8, 26), a: rand(0, 6), y: rand(2.5, 7), s: rand(0.15, 0.35) * (i % 2 ? 1 : -1) });
      school.add(f);
    }
    // فقاعات
    const bubbles = [];
    const bm = new THREE.MeshStandardMaterial({ color: '#dff6ff', transparent: true, opacity: 0.45, roughness: 0.05 });
    for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(rand(0.08, 0.22), 10, 8), bm); b.position.set(rand(-28, 28), rand(0, 14), rand(-28, 28)); w.scene.add(b); bubbles.push(b); }
    // أشعة الضو من الفوق
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#bff3ff', transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })); r.position.set(rand(-25, 25), 15, rand(-25, 25)); r.rotation.z = 0.2; w.scene.add(r); }
    w.tick((dt, t) => {
      for (const o of fishes) { o.a += o.s * dt; o.f.position.set(Math.cos(o.a) * o.r, o.y + Math.sin(t + o.r) * 0.3, Math.sin(o.a) * o.r); o.f.rotation.y = -o.a + (o.s > 0 ? -Math.PI / 2 : Math.PI / 2); }
      for (const b of bubbles) { b.position.y += dt * 1.2; b.position.x += Math.sin(t * 2 + b.position.z) * dt * 0.2; if (b.position.y > 16) b.position.y = 0; }
    });
  },
};

// ================================================= مغامرة الفضاء 🚀
const spaceTile = { ped: '#c9c9db', border: '#7b2cbf', bg: '#f3edff' };
const space = {
  id: 'space', medal: 'space', hat: 'astro', questChest: 'quest2b', questDone: 'quest3b',
  theme: { bg: '#090a26', fog: '#090a26', fogNear: 70, fogFar: 220, rim: '#6e6e85', ground: '#c3c3d3', patch: '#adadc0', sky: '#c8d4ff', groundLight: '#3a3a55', hemi: 1.2, sun: '#ffffff', sunI: 2.6 },
  lines: { welcome: 'space_welcome', mission: 'space_mission', allKeys: 'all_keys_go', chestOpen: 'space_chest', chat: ['space_chat_1', 'space_chat_2', 'bibo_chat_2'] },
  order: ['planets', 'dirs', 'psizes'],
  zones: {
    planets: { pos: POS.a, ring: '#ffd23f', floor: '#9a9ab0', items: ['sun', 'moon', 'earth', 'star', 'rocket', 'comet'], line: 'tap_animal', intro: 'planets_intro', wrong: 'you_chose', hello: k => ['look_x', k], make: emojiTile(spaceTile) },
    dirs: { pos: POS.b, ring: '#4cc9f0', floor: '#9a9ab0', spread: 1.6, items: ['up', 'down', 'left', 'right'], line: 'ask_dir', intro: 'dirs_intro', wrong: 'this_dir', hello: k => ['look_x', k],
      make: key => makeTile(drawArrow(key), { ...spaceTile, border: '#4cc9f0', bg: '#ffffff' }) },
    psizes: { pos: POS.c, ring: '#ff8fab', floor: '#9a9ab0', spread: 1.3, items: ['small', 'big', 'mid'], ask: askBigSmall, intro: 'psizes_intro', wrong: sizeWrong,
      make: key => key === 'big' ? makePlanet(0.95, '#ff9f43', true) : key === 'mid' ? makePlanet(0.6, '#4cc9f0') : makePlanet(0.32, '#80ed99') },
  },
  decor(w) {
    // النجوم ف السما
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3(rand(-1, 1), rand(0.05, 1), rand(-1, 1)).normalize().multiplyScalar(170); pos.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    w.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.3, fog: false })));
    // الأرض و كوكب بالحلقة ف السما
    const earth = mesh(new THREE.SphereGeometry(16, 40, 30), new THREE.MeshStandardMaterial({ color: '#2a7de1', emissive: '#103f7a', emissiveIntensity: 0.5, fog: false }), -70, 45, -130); w.scene.add(earth);
    for (let i = 0; i < 6; i++) { const c = mesh(new THREE.SphereGeometry(rand(4, 7), 16, 12), new THREE.MeshStandardMaterial({ color: '#38b000', emissive: '#1b5e20', emissiveIntensity: 0.4, fog: false }), 0, 0, 0); c.position.set(-70 + rand(-9, 9), 45 + rand(-9, 9), -130 + 11); c.scale.z = 0.4; w.scene.add(c); }
    const sat = mesh(new THREE.SphereGeometry(8, 32, 24), new THREE.MeshStandardMaterial({ color: '#ffb347', emissive: '#8a4b00', emissiveIntensity: 0.4, fog: false }), 80, 35, -110); w.scene.add(sat);
    const sr = mesh(new THREE.TorusGeometry(13, 1.2, 8, 48), new THREE.MeshStandardMaterial({ color: '#ffe8a3', emissive: '#806020', emissiveIntensity: 0.4, fog: false }), 80, 35, -110); sr.rotation.x = 1.25; w.scene.add(sr);
    // حفر القمر
    w.scatter(14, 4, 28, () => { const g = new THREE.Group(); const c = mesh(new THREE.TorusGeometry(rand(0.7, 1.4), 0.25, 8, 24), mat('#a3a3b8'), 0, 0.05, 0, g); c.rotation.x = Math.PI / 2; c.scale.z = 0.5; return g; }, 0);
    // صخور
    w.scatter(10, 6, 28, () => { const g = new THREE.Group(); const r = mesh(new THREE.DodecahedronGeometry(rand(0.5, 1.1), 0), mat('#8c8ca3', { roughness: 0.95 }), 0, 0.3, 0, g); r.rotation.set(rand(0, 3), rand(0, 3), 0); return g; }, 0.8);
    // صاروخ كبير
    const rk = new THREE.Group();
    mesh(new THREE.CylinderGeometry(1.1, 1.1, 5, 24), mat('#f1f1f1'), 0, 3.2, 0, rk);
    mesh(new THREE.ConeGeometry(1.1, 2, 24), mat('#e63946'), 0, 6.7, 0, rk);
    mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 20), mat('#4cc9f0', { emissive: '#4cc9f0', emissiveIntensity: 0.6 }), 0, 4.3, 1.05, rk).rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) { const f = mesh(new THREE.BoxGeometry(0.15, 1.6, 1.2), mat('#e63946'), Math.cos(i * Math.PI / 2) * 1.2, 1.2, Math.sin(i * Math.PI / 2) * 1.2, rk); f.rotation.y = -i * Math.PI / 2; }
    w.place(rk, 16, 14, 1.6);
    // الكائنات الفضائية الخضرين (نباتات كيضويو)
    const glows = [];
    w.scatter(10, 8, 27, (i) => {
      const g = new THREE.Group(); const h = rand(0.8, 1.8);
      mesh(new THREE.CylinderGeometry(0.08, 0.12, h, 8), mat('#5e60ce'), 0, h / 2, 0, g);
      const b = mesh(new THREE.SphereGeometry(0.3, 14, 10), mat(['#80ed99', '#f72585', '#4cc9f0'][i % 3], { emissive: ['#80ed99', '#f72585', '#4cc9f0'][i % 3], emissiveIntensity: 0.9 }), 0, h + 0.2, 0, g);
      glows.push(b); return g;
    }, 0.4);
    w.tick((dt, t) => { glows.forEach((b, i) => b.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.15)); earth.rotation.y = t * 0.05; });
  },
};

// ================================================= وادي الديناصورات 🦖
const dinoTile = { ped: '#c8a165', border: '#52b788', bg: '#f1fff4' };
const dino = {
  id: 'dino', medal: 'dino', hat: 'dino', questChest: 'quest2b', questDone: 'quest3b',
  theme: { bg: '#a8e6ff', fog: '#d4f1c5', sea: '#3fa7d6', rim: '#c8a165', ground: '#7cc35a', patch: '#93d36f' },
  lines: { welcome: 'dino_welcome', mission: 'dino_mission', allKeys: 'all_keys_go', chestOpen: 'dino_chest', chat: ['dino_chat_1', 'dino_chat_2', 'bibo_chat_2'] },
  order: ['dinos', 'dsizes', 'sounds'],
  zones: {
    dinos: { pos: POS.a, ring: '#52b788', floor: '#e9d8a6', items: ['trex', 'longneck', 'croc', 'lizard', 'volcano', 'bone'], line: 'tap_animal', intro: 'dinos_intro', wrong: 'you_chose', hello: k => ['look_x', k], make: emojiTile(dinoTile) },
    dsizes: { pos: POS.b, ring: '#ffb703', floor: '#e9d8a6', spread: 1.3, items: ['mid', 'small', 'big'], ask: askBigSmall, intro: 'dsizes_intro', wrong: sizeWrong,
      make: key => makeTile(drawEmoji('🦕', 180), { ...dinoTile, border: '#ffb703', size: key === 'big' ? 1.25 : key === 'mid' ? 0.8 : 0.45, pedH: key === 'big' ? 0.5 : 0.8 }) },
    sounds: { pos: POS.c, ring: '#ff8fab', floor: '#e9d8a6', items: ['cow', 'sheep', 'dog', 'cat', 'chicken', 'duck'], intro: 'sounds_intro', wrong: 'you_chose', hello: k => ['look_x', 'snd_' + k],
      ask: (pz) => { const goal = pick(['cow', 'sheep', 'dog', 'cat', 'chicken', 'duck'].filter(k => k !== pz.last)); return { goal, line: 'ask_sound', x: 'snd_' + goal }; },
      make: emojiTile({ ...dinoTile, border: '#ff8fab' }) },
  },
  decor(w) {
    // البركان ف اللور
    const vol = new THREE.Group();
    mesh(new THREE.ConeGeometry(9, 11, 32, 1, true), mat('#6d4c41'), 0, 5.5, 0, vol);
    const top = mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.4, 24), mat('#ff6d00', { emissive: '#ff3d00', emissiveIntensity: 1 }), 0, 10.4, 0, vol);
    w.place(vol, 0, -27, 7.5);
    const smoke = [];
    for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshStandardMaterial({ color: '#9e9e9e', transparent: true, opacity: 0.5 })); w.scene.add(s); smoke.push({ s, k: i / 8 }); }
    w.tick((dt, t) => {
      top.material.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.3;
      for (const o of smoke) { o.k = (o.k + dt * 0.08) % 1; o.s.position.set(Math.sin(o.k * 8) * 1.5, 12 + o.k * 14, -27 + o.k * 3); o.s.scale.setScalar(1 + o.k * 3); o.s.material.opacity = 0.5 * (1 - o.k); }
    });
    // أشجار النخيل القديمة و السرخس
    for (let i = 0; i < 14; i++) { const p = w.freeSpot(16, 28.5, 7); if (p && p.z > -17) w.addPalm(p.x, p.z); }
    w.scatter(16, 4, 26, (i) => {
      const g = new THREE.Group();
      for (let k = 0; k < 6; k++) { const l = mesh(new THREE.ConeGeometry(0.25, 1.6, 6), mat(k % 2 ? '#2d6a4f' : '#40916c'), 0, 0.6, 0, g); l.rotation.set(0.7, k, 0); l.position.set(Math.sin(k) * 0.35, 0.5, Math.cos(k) * 0.35); }
      return g;
    }, 0.5);
    // بيض الديناصور
    w.scatter(6, 6, 24, (i) => {
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) { const e = mesh(new THREE.SphereGeometry(0.35, 16, 12), mat(['#fff3d6', '#d8f3dc', '#ffe5ec'][k]), Math.cos(k * 2.1) * 0.4, 0.4, Math.sin(k * 2.1) * 0.4, g); e.scale.y = 1.3; }
      const nest = mesh(new THREE.TorusGeometry(0.75, 0.22, 8, 20), mat('#a47148'), 0, 0.15, 0, g); nest.rotation.x = Math.PI / 2;
      return g;
    }, 0.9);
    // ديناصور كبير لطيف (طويل العنق) كيتمشى بعيد
    const big = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(1.6, 24, 16), mat('#80b918'), 0, 2.6, 0, big); body.scale.set(1.5, 1, 1);
    const neck = mesh(new THREE.CylinderGeometry(0.35, 0.55, 3.6, 12), mat('#80b918'), 2.1, 4.3, 0, big); neck.rotation.z = -0.5;
    mesh(new THREE.SphereGeometry(0.55, 16, 12), mat('#80b918'), 3.1, 5.9, 0, big);
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.1, 8, 6), mat('#222'), 3.5, 6.05, s * 0.3, big);
    const tail = mesh(new THREE.ConeGeometry(0.5, 3.2, 12), mat('#80b918'), -3.3, 2.4, 0, big); tail.rotation.z = Math.PI / 2 + 0.2;
    for (const [x, z] of [[-1, -0.8], [-1, 0.8], [1, -0.8], [1, 0.8]]) mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.6, 10), mat('#73a816'), x, 0.8, z, big);
    big.traverse(o => { if (o.isMesh) o.castShadow = true; });
    w.scene.add(big);
    w.tick((dt, t) => { const a = t * 0.05; big.position.set(Math.cos(a) * 36, 0, Math.sin(a) * 36); big.rotation.y = -a - Math.PI / 2 + Math.PI; big.position.y = Math.abs(Math.sin(t * 2)) * 0.15; });
    w.scatter(8, 6, 27, () => { const g = new THREE.Group(); const r = mesh(new THREE.DodecahedronGeometry(rand(0.6, 1.2), 0), mat('#9c8b7a', { roughness: 0.9 }), 0, 0.3, 0, g); r.rotation.set(rand(0, 3), rand(0, 3), 0); return g; }, 0.9);
  },
};

// ================================================= المدينة المغربية السحرية 🕌
const morTile = { ped: '#e9c46a', border: '#1d4e89', bg: '#fffaf0' };
const JOB_TOOL = { cook: 'pan', doctor: 'stetho', police: 'policecar', firefighter: 'firetruck', farmer: 'tractor', teacher: 'books' };
const morocco = {
  id: 'morocco', medal: 'morocco', hat: 'fez', questChest: 'quest2b', questDone: 'quest3b',
  theme: { bg: '#8fd3ff', fog: '#ffe8c2', rim: '#e9c46a', ground: '#e7c9a0', patch: '#dcb68a', groundLight: '#d4a373' },
  lines: { welcome: 'morocco_welcome', mission: 'morocco_mission', allKeys: 'all_keys_go', chestOpen: 'morocco_chest', chat: ['morocco_chat_1', 'morocco_chat_2', 'bibo_chat_2'] },
  order: ['jobs', 'tools', 'culture'],
  zones: {
    jobs: { pos: POS.a, ring: '#1d4e89', floor: '#f6e7cb', items: ['cook', 'doctor', 'police', 'firefighter', 'farmer', 'teacher'], line: 'tap_animal', intro: 'jobs_intro', wrong: 'you_chose', hello: k => ['look_x', k], make: emojiTile(morTile) },
    tools: { pos: POS.b, ring: '#2a9d8f', floor: '#f6e7cb', items: ['pan', 'stetho', 'policecar', 'firetruck', 'tractor', 'books'], intro: 'tools_intro', wrong: 'you_chose', hello: k => ['look_x', k],
      ask: (pz) => { const job = pick(Object.keys(JOB_TOOL).filter(j => JOB_TOOL[j] !== pz.last)); return { goal: JOB_TOOL[job], line: 'ask_tool', x: job }; },
      make: emojiTile({ ...morTile, border: '#2a9d8f' }) },
    culture: { pos: POS.c, ring: '#c1121f', floor: '#f6e7cb', items: ['camel', 'mosque', 'palm', 'orangefruit', 'tea', 'drum'], line: 'tap_animal', intro: 'culture_intro', wrong: 'you_chose', hello: k => ['look_x', k], make: emojiTile({ ...morTile, border: '#c1121f' }) },
  },
  decor(w) {
    // الصومعة ف اللور
    const tw = new THREE.Group();
    mesh(new THREE.BoxGeometry(3.2, 13, 3.2), mat('#e9c46a'), 0, 6.5, 0, tw);
    for (const y of [4, 8, 11]) for (let s = 0; s < 4; s++) { const win = mesh(new THREE.BoxGeometry(0.7, 1.2, 0.1), mat('#1d4e89'), 0, y, 1.62, tw); const p = new THREE.Group(); p.rotation.y = s * Math.PI / 2; p.add(win); tw.add(p); }
    mesh(new THREE.BoxGeometry(3.5, 0.5, 3.5), mat('#2a9d8f'), 0, 13.2, 0, tw);
    mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), mat('#e9c46a'), 0, 14.6, 0, tw);
    mesh(new THREE.ConeGeometry(1.2, 1.2, 4), mat('#2a9d8f'), 0, 16.4, 0, tw).rotation.y = Math.PI / 4;
    mesh(new THREE.SphereGeometry(0.25, 12, 10), mat('#ffd23f', { metalness: 0.6 }), 0, 17.2, 0, tw);
    w.place(tw, 0, -24, 2.6);
    // الديور: أبيض و أصفر، بيبان زرقين و أقواس
    const wallCols = ['#fdf6e3', '#f4d6a0', '#f7e1c0', '#ffffff'];
    const doorCols = ['#1d4e89', '#2a9d8f', '#c1121f', '#3a86ff'];
    let n = 0;
    for (let i = 0; i < 40 && n < 16; i++) {
      const a = rand(0, Math.PI * 2), r = rand(19, 27);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (w.nearZone(x, z, 8) || Math.hypot(x - w.CHEST.x, z - w.CHEST.z) < 6 || Math.hypot(x - w.SPAWN.x, z - w.SPAWN.z) < 6 || w.blocked(x, z, 3)) continue;
      const g = new THREE.Group(); const h = rand(2.5, 4.2), wd = rand(2.6, 3.6);
      mesh(new THREE.BoxGeometry(wd, h, wd), mat(wallCols[n % 4]), 0, h / 2, 0, g);
      const door = mesh(new THREE.BoxGeometry(0.9, 1.5, 0.1), mat(doorCols[n % 4]), 0, 0.75, wd / 2 + 0.03, g);
      mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 20, 1, false, -Math.PI / 2, Math.PI), mat(doorCols[n % 4]), 0, 1.5, wd / 2 + 0.03, g).rotation.x = Math.PI / 2;
      for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.5, 0.6, 0.08), mat('#2a9d8f'), s * (wd / 2 - 0.6), h - 0.9, wd / 2 + 0.03, g);
      mesh(new THREE.BoxGeometry(wd + 0.2, 0.2, wd + 0.2), mat('#d4a373'), 0, h, 0, g);
      g.rotation.y = Math.atan2(-x, -z);
      w.place(g, x, z, wd * 0.75); n++;
    }
    // النخل
    for (let i = 0; i < 8; i++) { const p = w.freeSpot(12, 26, 7); if (p) w.addPalm(p.x, p.z); }
    // الفوانيس
    const lamps = [];
    w.scatter(8, 6, 18, () => {
      const g = new THREE.Group();
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), mat('#3d2b1f'), 0, 1.2, 0, g);
      const l = mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.55, 8), mat('#ffd23f', { emissive: '#ffb703', emissiveIntensity: 0.9 }), 0, 2.5, 0, g);
      mesh(new THREE.ConeGeometry(0.3, 0.35, 8), mat('#b08968', { metalness: 0.5 }), 0, 2.95, 0, g);
      lamps.push(l); return g;
    }, 0.3);
    // الخصة (نافورة) بالزليج
    const ft = new THREE.Group();
    mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.7, 8), mat('#2a9d8f'), 0, 0.35, 0, ft);
    mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.1, 24), mat('#4cc9f0', { roughness: 0.1 }), 0, 0.68, 0, ft);
    mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 10), mat('#f4d6a0'), 0, 1.2, 0, ft);
    const water = mesh(new THREE.SphereGeometry(0.4, 14, 10), mat('#bdeeff', { transparent: true, opacity: 0.7 }), 0, 1.9, 0, ft);
    w.place(ft, -7, 15, 2);
    w.tick((dt, t) => { water.scale.set(1, 1 + Math.sin(t * 4) * 0.2, 1); lamps.forEach((l, i) => { l.material.emissiveIntensity = 0.8 + Math.sin(t * 2 + i) * 0.2; }); });
    // زربية مغربية ف الوسط
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), mat('#c1121f')); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.22, 4); w.scene.add(rug);
    const rug2 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.2), mat('#ffd23f')); rug2.rotation.x = -Math.PI / 2; rug2.position.set(0, 0.225, 4); w.scene.add(rug2);
    const rug3 = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 4.8), mat('#1d4e89')); rug3.rotation.x = -Math.PI / 2; rug3.position.set(0, 0.23, 4); w.scene.add(rug3);
  },
};

// شجر كبير: ما نحطوهش ف الطريق ديال الكاميرا (بين البداية و الكنز)
function scatterTall(w, n, rMin, rMax, maker, r = 1) {
  let k = 0;
  for (let i = 0; i < n * 4 && k < n; i++) { const p = w.freeSpot(rMin, rMax, 6); if (!p || (p.z > 4 && Math.abs(p.x) < 15)) continue; w.place(maker(k, p), p.x, p.z, r); k++; }
}
// ================================================= غابة الحيوانات 🦁 (5 مفاتيح)
const jTile = { ped: '#c8a165', border: '#2d6a4f', bg: '#f1fff4' };
const FOOD = { monkey: 'banana', rabbit: 'carrot', bear: 'honey', panda: 'bamboo', mouse: 'cheese', cat: 'fish' };
const jungle = {
  id: 'jungle', medal: 'jungle', hat: 'safari', questChest: 'quest2b', questDone: 'quest3b',
  theme: { bg: '#9fdcb5', fog: '#c9eed6', fogNear: 55, fogFar: 140, sea: '#2a9d8f', rim: '#8d6e4a', ground: '#5aa84f', patch: '#6dbb5e', groundLight: '#7a5c3a' },
  lines: { welcome: 'jungle_welcome', mission: 'jungle_mission', allKeys: 'all_keys_go', chestOpen: 'jungle_chest', chat: ['jungle_chat_1', 'jungle_chat_2', 'bibo_chat_2'] },
  order: ['janimals', 'insects', 'bananas', 'elephants', 'food'],
  zones: {
    janimals: { pos: POS.a, ring: '#ffb703', floor: '#e9d8a6', items: ['lion', 'tiger', 'zebra', 'gorilla', 'hippo', 'snake'], line: 'tap_animal', intro: 'janimals_intro', wrong: 'you_chose', hello: k => ['animal_hello', k], make: emojiTile({ ...jTile, border: '#ffb703' }) },
    insects: { pos: POS.b, ring: '#ff8fab', floor: '#e9d8a6', items: ['butterfly', 'bee', 'ladybug', 'ant', 'snail', 'caterpillar'], line: 'tap_animal', intro: 'insects_intro', wrong: 'you_chose', hello: k => ['look_x', k], make: emojiTile({ ...jTile, border: '#ff8fab' }) },
    bananas: { pos: POS.c, ring: '#ffd23f', floor: '#e9d8a6', items: ['n2', 'n3', 'n4', 'n5', 'n6'], line: 'ask_banana', intro: 'bananas_intro', wrong: 'count_is', hello: k => ['count_is', k],
      make: key => makeTile(drawCount(num(key), '🍌'), { ...jTile, border: '#ffd23f' }) },
    elephants: { pos: POS.d, ring: '#8d99ae', floor: '#e9d8a6', spread: 1.3, items: ['mid', 'small', 'big'], ask: askBigSmall, intro: 'elephants_intro', wrong: sizeWrong,
      make: key => makeTile(drawEmoji('🐘', 180), { ...jTile, border: '#8d99ae', size: key === 'big' ? 1.25 : key === 'mid' ? 0.8 : 0.45, pedH: key === 'big' ? 0.5 : 0.8 }) },
    food: { pos: POS.e, ring: '#fb8500', floor: '#e9d8a6', items: ['banana', 'carrot', 'honey', 'bamboo', 'cheese', 'fish'], intro: 'food_intro', wrong: 'you_chose', hello: k => ['look_x', k],
      ask: (pz) => { const an = pick(Object.keys(FOOD).filter(a => FOOD[a] !== pz.last)); return { goal: FOOD[an], line: 'ask_food', x: an }; },
      make: emojiTile({ ...jTile, border: '#fb8500' }) },
  },
  decor(w) {
    // أشجار كبار ديال الغابة
    scatterTall(w, 16, 15, 28.5, (i) => {
      const g = new THREE.Group(); const h = rand(3.5, 5.5);
      mesh(new THREE.CylinderGeometry(0.35, 0.55, h, 10), mat('#7a4b22'), 0, h / 2, 0, g);
      const cols = ['#2d6a4f', '#40916c', '#1b4332'];
      for (let k = 0; k < 4; k++) mesh(new THREE.SphereGeometry(rand(1.3, 2), 14, 10), mat(cols[(i + k) % 3]), rand(-1, 1), h + rand(-0.3, 0.8), rand(-1, 1), g);
      return g;
    }, 1);
    for (let i = 0; i < 8; i++) { const p = w.freeSpot(12, 26, 7); if (p) w.addPalm(p.x, p.z); }
    for (let i = 0; i < 18; i++) { const p = w.freeSpot(4, 23, 6); if (p) { if (i % 4 === 0) w.addRock(p.x, p.z); else w.addBush(p.x, p.z); } }
    // زهور كبار ملونين
    w.scatter(12, 5, 24, (i) => {
      const g = new THREE.Group();
      mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 6), mat('#38b000'), 0, 0.45, 0, g);
      mesh(new THREE.SphereGeometry(0.28, 12, 8), mat(['#f72585', '#ffd60a', '#ff6d00', '#c77dff'][i % 4]), 0, 1, 0, g).scale.y = 0.5;
      return g;
    }, 0);
    // فراشات كيطيرو
    const flies = [];
    for (let i = 0; i < 10; i++) {
      const f = new THREE.Group(); const c = mat(['#f72585', '#4cc9f0', '#ffd60a', '#ff9f1c'][i % 4], { side: THREE.DoubleSide });
      for (const s of [-1, 1]) { const wg = mesh(new THREE.CircleGeometry(0.22, 10), c, s * 0.18, 0, 0, f); wg.rotation.x = -Math.PI / 2; flies.push({ wg, s }); }
      f.userData = { r: rand(5, 22), a: rand(0, 6), y: rand(1.2, 3), sp: rand(0.2, 0.5) * (i % 2 ? 1 : -1) };
      w.scene.add(f); flies.push({ f });
    }
    w.tick((dt, t) => {
      for (const o of flies) {
        if (o.f) { const u = o.f.userData; u.a += u.sp * dt; o.f.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 2 + u.r) * 0.4, Math.sin(u.a) * u.r); o.f.rotation.y = -u.a; }
        else o.wg.rotation.z = o.s * Math.sin(t * 14) * 0.8;
      }
    });
  },
};
// ================================================= القطب المتجمد ❄️ (5 مفاتيح)
const iTile = { ped: '#e3f2fd', border: '#4895ef', bg: '#f5fbff' };
const ice = {
  id: 'ice', medal: 'ice', hat: 'beanie', questChest: 'quest2b', questDone: 'quest3b',
  theme: { bg: '#bfe3ff', fog: '#e6f4ff', fogNear: 55, fogFar: 150, sea: '#3a86c8', rim: '#dceeff', ground: '#f4fbff', patch: '#e1f0ff', sky: '#ffffff', groundLight: '#a9cbe6', hemi: 1.15, sunI: 2.1 },
  lines: { welcome: 'ice_welcome', mission: 'ice_mission', allKeys: 'all_keys_go', chestOpen: 'ice_chest', chat: ['ice_chat_1', 'ice_chat_2', 'bibo_chat_2'] },
  order: ['polar', 'clothes', 'flakes', 'snowmen', 'weather'],
  zones: {
    polar: { pos: POS.a, ring: '#4895ef', floor: '#dbeeff', items: ['polarbear', 'penguin', 'seal', 'fox', 'owl', 'reindeer'], line: 'tap_animal', intro: 'polar_intro', wrong: 'you_chose', hello: k => ['animal_hello', k], make: emojiTile(iTile) },
    clothes: { pos: POS.b, ring: '#e63946', floor: '#dbeeff', items: ['scarf', 'gloves', 'coat', 'boot', 'socks', 'skis'], line: 'tap_animal', intro: 'clothes_intro', wrong: 'you_chose', hello: k => ['look_x', k], make: emojiTile({ ...iTile, border: '#e63946' }) },
    flakes: { pos: POS.c, ring: '#90e0ef', floor: '#dbeeff', items: ['n2', 'n3', 'n4', 'n5', 'n6'], line: 'ask_flakes', intro: 'flakes_intro', wrong: 'count_is', hello: k => ['count_is', k],
      make: key => makeTile(drawCount(num(key), '❄️'), { ...iTile, border: '#90e0ef', bg: '#eaf6ff' }) },
    snowmen: { pos: POS.d, ring: '#ffb703', floor: '#dbeeff', spread: 1.3, items: ['mid', 'small', 'big'], ask: askBigSmall, intro: 'snowmen_intro', wrong: sizeWrong,
      make: key => makeTile(drawEmoji('⛄', 180), { ...iTile, border: '#ffb703', size: key === 'big' ? 1.25 : key === 'mid' ? 0.8 : 0.45, pedH: key === 'big' ? 0.5 : 0.8 }) },
    weather: { pos: POS.e, ring: '#7b2cbf', floor: '#dbeeff', items: ['sun', 'snow', 'rain', 'wind', 'cloud', 'rainbow'], line: 'tap_animal', intro: 'weather_intro', wrong: 'you_chose', hello: k => ['look_x', k], make: emojiTile({ ...iTile, border: '#7b2cbf' }) },
  },
  decor(w) {
    // صنوبر عليه الثلج
    scatterTall(w, 18, 15, 28.5, () => {
      const g = new THREE.Group(); const h = rand(0.9, 1.3);
      mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.2 * h, 8), mat('#6b4423'), 0, 0.6 * h, 0, g);
      for (let k = 0; k < 3; k++) {
        mesh(new THREE.ConeGeometry((1.6 - k * 0.4) * h, 1.6 * h, 10), mat('#2d6a4f'), 0, (1.4 + k * 1) * h, 0, g);
        mesh(new THREE.ConeGeometry((1.0 - k * 0.25) * h, 0.6 * h, 10), mat('#ffffff'), 0, (1.95 + k * 1) * h, 0, g);
      }
      return g;
    }, 1);
    // كتل الثلج
    w.scatter(12, 5, 26, () => { const g = new THREE.Group(); const b = mesh(new THREE.DodecahedronGeometry(rand(0.5, 1), 0), mat('#cfe8ff', { roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.9 }), 0, 0.35, 0, g); b.rotation.set(rand(0, 3), rand(0, 3), 0); return g; }, 0.9);
    // الإكلو
    const ig = new THREE.Group();
    mesh(new THREE.SphereGeometry(2.4, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffffff', { roughness: 0.6 }), 0, 0, 0, ig);
    const door = mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 16, 1, false, 0, Math.PI), mat('#ffffff'), 0, 0, 2.1, ig); door.rotation.z = Math.PI / 2; door.rotation.y = Math.PI / 2;
    mesh(new THREE.CircleGeometry(0.62, 16, 0, Math.PI), mat('#1d3557'), 0, 0.02, 2.82, ig);
    for (let k = 1; k < 4; k++) { const r = mesh(new THREE.TorusGeometry(2.42 * Math.cos(k * 0.38), 0.03, 6, 40), mat('#d7ecff'), 0, 2.42 * Math.sin(k * 0.38), 0, ig); r.rotation.x = Math.PI / 2; }
    ig.rotation.y = Math.PI * 0.85;
    w.place(ig, 0, -22, 3);
    // جبال الثلج ف البحر
    for (let i = 0; i < 7; i++) { const a = rand(0, Math.PI * 2), r = rand(40, 70); const b = new THREE.Mesh(new THREE.ConeGeometry(rand(3, 6), rand(4, 9), 6), mat('#eef7ff')); b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); w.scene.add(b); }
    // الثلج كيطيح
    const n = 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([rand(-35, 35), rand(0, 22), rand(-35, 35)], i * 3);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    w.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.13 })));
    w.tick((dt, t) => {
      const a = sg.attributes.position.array;
      for (let i = 0; i < n; i++) { a[i * 3 + 1] -= dt * 1.4; a[i * 3] += Math.sin(t + i) * dt * 0.3; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 22; }
      sg.attributes.position.needsUpdate = true;
    });
  },
};
export const WORLD_CONFIGS = { island, candy, sea, space, dino, morocco, jungle, ice };
export const WORLD_ORDER = ['island', 'candy', 'sea', 'space', 'dino', 'morocco', 'jungle', 'ice'];
