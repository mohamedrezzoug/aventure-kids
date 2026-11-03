// عالم المغامرات – Aventure Kids 3D: الشاشات و الحلقة الرئيسية
import * as THREE from './three.module.js';
import { T, setLang, lang, LINES, lineText, lineTextIn } from './i18n.js?v=7';
import { Voice, Sfx, Music } from './audio.js?v=7';
import { S, save, resetAll, today, worldState } from './state.js?v=7';
import { makeKid, makeBibo, makeLoulou, mat } from './characters.js?v=7';
import { World } from './world.js?v=7';
import { WORLD_CONFIGS, WORLD_ORDER } from './worlds.js?v=7';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ------------------------------------------------ الرسم
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// ------------------------------------------------ مشهد القائمة (الأبطال)
const menu = { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(40, 1, 0.1, 200) };
menu.scene.background = new THREE.Color('#8fd3ff');
menu.scene.fog = new THREE.Fog('#c4ecff', 25, 70);
menu.scene.add(new THREE.HemisphereLight('#e0f4ff', '#c9a46b', 1.4));
const msun = new THREE.DirectionalLight('#fff3d6', 2.2); msun.position.set(6, 12, 8); msun.castShadow = true; msun.shadow.mapSize.set(1024, 1024);
Object.assign(msun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
menu.scene.add(msun);
const mground = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.5, 0.6, 48), mat('#78c45c')); mground.position.y = -0.3; mground.receiveShadow = true; menu.scene.add(mground);
const msea = new THREE.Mesh(new THREE.CircleGeometry(80, 48), mat('#25b4d8', { roughness: 0.2 })); msea.rotation.x = -Math.PI / 2; msea.position.y = -0.5; menu.scene.add(msea);
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + 0.3;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.6 + (i % 3) * 0.2, 14, 10), mat(i % 2 ? '#4caf50' : '#5cbf60'));
  b.position.set(Math.cos(a) * 5.8, 0.2, Math.sin(a) * 5.8 - 1); b.castShadow = true; menu.scene.add(b);
}
const kids = {
  rayan: makeKid({ girl: false, shirt: S.shirt.rayan, hair: S.hair.rayan, hat: S.hat }),
  salma: makeKid({ girl: true, shirt: S.shirt.salma, hair: S.hair.salma, skin: '#e8b48e', hat: S.hat }),
};
kids.rayan.root.position.set(-1.3, 0, 0); kids.salma.root.position.set(1.3, 0, 0);
menu.scene.add(kids.rayan.root, kids.salma.root);
const mbibo = makeBibo(); mbibo.root.position.set(0, 2.6, -1.5); menu.scene.add(mbibo.root);
const mloulou = makeLoulou(); mloulou.root.position.set(-3.6, 0, -1.8); mloulou.root.rotation.y = 0.5; menu.scene.add(mloulou.root);
let menuView = 'both';

// ------------------------------------------------ العوالم (كيتصاوبو غير ملي كيتحلو أول مرة)
const uiHooks = {
  onKeys: n => { $('#keyCount').textContent = n; },
  onStars: n => { $$('.starCount').forEach(e => (e.textContent = n)); },
  onQuest: q => { $('#quest').textContent = q; },
  onPrompt: p => { $('#prompt').classList.toggle('on', !!p); $('#promptTxt').textContent = p ? '🔍 ' + p : ''; },
  onReward: r => toast(r),
  onWorldDone: id => showDone(id),
};
const worldCache = {};
let cur = null; // العالم اللي كنلعبو فيه دابا
function getWorld(id) {
  if (!worldCache[id]) { worldCache[id] = new World(renderer, uiHooks, WORLD_CONFIGS[id]); worldCache[id].resize(innerWidth, innerHeight); }
  return worldCache[id];
}
const NOJOY = { joy: { x: 0, y: 0 } };

// ------------------------------------------------ الحوار
const FACES = { bibo: '🐲', loulou: '🧚', rayan: '👦', salma: '👧' };
let lastLine = null, dialogTimer = null;
Voice.onLine = (who, text, id, x) => {
  lastLine = { id, x };
  $('#dFace').textContent = FACES[who] || '🙂';
  $('#dName').textContent = T(who);
  $('#dSay').textContent = text;
  // الترجمة باللغة الأخرى صغيرة
  const other = lang === 'ar' ? 'fr' : 'ar';
  const e = LINES[id];
  const t2 = e ? lineTextIn(id, x, other) : '';
  $('#dSay2').textContent = t2 || '';
  $('#dSay2').dir = other === 'ar' ? 'rtl' : 'ltr';
  $('#dialog').classList.add('on');
  clearTimeout(dialogTimer);
  dialogTimer = setTimeout(() => $('#dialog').classList.remove('on'), 2500 + text.length * 90);
};

function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1800);
}

// ------------------------------------------------ الشاشات
let screen = 'start';
function applyTexts() {
  $$('[data-t]').forEach(e => { e.textContent = T(e.dataset.t); });
  $$('.lang').forEach(b => b.classList.toggle('sel', b.dataset.lang === lang));
  $$('.lang2').forEach(b => b.classList.toggle('sel', b.dataset.lang === lang));
  if (cur && cur.hero) cur.updateQuest();
}
function show(id) {
  screen = id;
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  if (id === 'map') renderMap();
  if (id === 'rewards') renderRewards();
  if (id === 'wardrobe') renderWardrobe();
  if (id === 'parents') renderParents();
  if (id === 'hero') selectHero(S.hero, false);
  menuView = id === 'wardrobe' ? 'one' : 'both';
  if (id !== 'hud') { Voice.stop(); $('#dialog').classList.remove('on'); }
  $$('.starCount').forEach(e => (e.textContent = S.stars));
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => { Sfx.tap(); show(b.dataset.go); }));

// اللغة
setLang(S.lang || 'ar');
applyTexts();
$$('.lang, .lang2').forEach(b => b.addEventListener('click', () => {
  Sfx.unlock(); Sfx.tap();
  setLang(b.dataset.lang); S.lang = b.dataset.lang; save(); applyTexts();
  if (screen === 'map') renderMap();
  if (screen === 'parents') renderParents();
}));
$('#btnPlay').addEventListener('click', () => { Sfx.unlock(); Sfx.good(); Music.start(); if (!S.lang) { S.lang = lang; save(); } show('hero'); Voice.say('bibo_hi'); });

// البطل
function selectHero(h, talk = true) {
  S.hero = h; save();
  $$('.heroCard').forEach(c => c.classList.toggle('sel', c.dataset.hero === h));
  kids[h].wave = 1.6;
  if (talk) Voice.say(h === 'rayan' ? 'hero_rayan' : 'hero_salma');
}
$$('.heroCard').forEach(c => c.addEventListener('click', () => { Sfx.pop(); selectHero(c.dataset.hero); }));
$('#btnHeroGo').addEventListener('click', () => { Sfx.good(); show('map'); });

// الخريطة
const WORLDS = [
  { id: 'island', em: '🏝️', bg: 'linear-gradient(#4cc9f0,#2a9d8f)', medalEm: '🏅' },
  { id: 'candy', em: '🍭', bg: 'linear-gradient(#ff8fab,#c9184a)', medalEm: '🍬' },
  { id: 'sea', em: '🐠', bg: 'linear-gradient(#48cae4,#0077b6)', medalEm: '🐚' },
  { id: 'space', em: '🚀', bg: 'linear-gradient(#7b2cbf,#240046)', medalEm: '🪐' },
  { id: 'dino', em: '🦖', bg: 'linear-gradient(#95d5b2,#2d6a4f)', medalEm: '🦕' },
  { id: 'morocco', em: '🕌', bg: 'linear-gradient(#f4a261,#c1121f)', medalEm: '🇲🇦' },
  { id: 'jungle', em: '🦁', bg: 'linear-gradient(#80b918,#2b9348)', medalEm: '🐒' },
  { id: 'ice', em: '❄️', bg: 'linear-gradient(#90e0ef,#3a86c8)', medalEm: '⛄' },
];
// العالم كيتحل ملي يتكمل اللي قبلو (و إلا كان الطفل بدا فيه من قبل، كيبقى محلول)
function worldOpen(i) { if (i === 0 || worldState(WORLDS[i - 1].id).done) return true; const st = S.worlds[WORLDS[i].id]; return !!(st && (st.done || st.keys.length)); }
function renderMap() {
  const w = $('#worlds'); w.innerHTML = '';
  WORLDS.forEach((W, i) => {
    const open = worldOpen(i), st = worldState(W.id);
    const d = document.createElement('div');
    d.className = 'world' + (open ? '' : ' locked');
    d.style.background = W.bg;
    const tag = open ? (st.done ? T('done') : '') : '🔒';
    let stars = '';
    const nz = WORLD_CONFIGS[W.id].order.length;
    if (open) { const n = Object.values(st.zoneStars).reduce((a, b) => a + b, 0); const k = Math.min(3, Math.round(n / nz)); stars = `<div class="stars">${'⭐'.repeat(k)}${'☆'.repeat(3 - k)}</div><small class="keys">🗝️ ${st.keys.length}/${nz}</small>`; }
    d.innerHTML = `${tag ? `<div class="tag">${tag}</div>` : ''}<div class="em">${W.em}</div><b>${T('w_' + W.id)}</b><small>${T('wd_' + W.id)}</small>${stars}` + (open && st.done ? `<button class="replayBtn">${T('replay')}</button>` : '');
    const rb = d.querySelector('.replayBtn');
    if (rb) rb.addEventListener('click', e => { e.stopPropagation(); Sfx.good(); replayWorld(W.id); });
    d.addEventListener('click', () => {
      if (!open) { Sfx.soft(); toast(T('needWorld', { w: T('w_' + WORLDS[i - 1].id) })); return; }
      Sfx.good(); startWorld(W.id);
    });
    w.appendChild(d);
  });
}
// نافذة "كملتي العالم"
function showDone(id) {
  const cfg = WORLD_CONFIGS[id], W = WORLDS.find(x => x.id === id);
  const H = HATS.find(h => h.id === cfg.hat);
  $('#doneTitle').textContent = T('worldDone', { w: T('w_' + id) });
  $('#doneItems').innerHTML = `<div class="medal">${W.medalEm}<br><span>${T('medal_' + id)}</span></div>` + (H ? `<div class="medal">${H.em}<br><span>${T('hat_' + H.id)}</span></div>` : '');
  $('#doneModal').classList.add('on');
}

// اللعب
function startWorld(id) {
  cur = getWorld(id);
  $('#keyTotal').textContent = WORLD_CONFIGS[id].order.length;
  show('hud');
  cur.start(S.hero);
  Music.start();
}
$('#btnHome').addEventListener('click', () => { Sfx.tap(); show('map'); });
$('#btnReplay').addEventListener('click', () => { Sfx.tap(); if (lastLine) Voice.say(lastLine.id, lastLine.x); });
$('#btnDSay').addEventListener('click', () => { Sfx.tap(); if (lastLine) Voice.say(lastLine.id, lastLine.x); });
$('#btnRepeat').addEventListener('click', () => { Sfx.tap(); if (cur) cur.repeatQuestion(); });
// نعاودو العالم من الأول (الميداليات و القبعات و النجوم كيبقاو)
function replayWorld(id) {
  getWorld(id).resetProgress();
  startWorld(id);
}
$('#doneReplay').addEventListener('click', () => { $('#doneModal').classList.remove('on'); Sfx.good(); if (cur) replayWorld(cur.id); });
$('#doneStay').addEventListener('click', () => { $('#doneModal').classList.remove('on'); });
$('#doneMap').addEventListener('click', () => { $('#doneModal').classList.remove('on'); show('map'); });

// اللمس ف الـ canvas
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; Sfx.unlock(); });
canvas.addEventListener('pointerup', e => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  if (moved < 18) {
    const nx = (e.clientX / innerWidth) * 2 - 1, ny = -(e.clientY / innerHeight) * 2 + 1;
    if (screen === 'hud' && cur) cur.tap(nx, ny);
    else if (screen === 'hero') { const h = nx < 0 ? 'rayan' : 'salma'; Sfx.pop(); selectHero(h); }
  }
  down = null;
});

// الجويستيك
const joy = $('#joy'), knob = joy.querySelector('.knob');
let joyId = null;
function joyMove(e) {
  const r = joy.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const max = r.width / 2 - 10, d = Math.hypot(dx, dy);
  if (d > max) { dx *= max / d; dy *= max / d; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  const J = (cur || NOJOY).joy; J.x = dx / max; J.y = dy / max;
}
joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); Sfx.unlock(); });
joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; knob.style.transform = ''; const J = (cur || NOJOY).joy; J.x = 0; J.y = 0; };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
// الكلافيي
const keys = {};
addEventListener('keydown', e => { keys[e.key] = true; });
addEventListener('keyup', e => { keys[e.key] = false; });
function keyboardJoy() {
  if (joyId !== null || !cur) return;
  const island = cur;
  const x = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  const y = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (x || y || island._kb) { island.joy.x = x; island.joy.y = y; island._kb = !!(x || y); }
}

// ------------------------------------------------ الملابس
const SHIRTS = ['#e5533d', '#2a7de1', '#38b000', '#ffb703', '#8e5bd6', '#ff5fa2', '#00b4d8', '#333333'];
const HAIRS = ['#3b2414', '#5a3220', '#1a1a1a', '#b5651d', '#e0b04b', '#7b3f00'];
const HATS = [{ id: 'none', em: '🙂', need: 0 }, { id: 'cap', em: '🧢', need: 0 }, { id: 'explorer', em: '🤠', need: 0, medal: 'island' }, { id: 'crown', em: '👑', need: 20 },
  { id: 'party', em: '🥳', medal: 'candy' }, { id: 'sailor', em: '⚓', medal: 'sea' }, { id: 'astro', em: '👩‍🚀', medal: 'space' }, { id: 'dino', em: '🦖', medal: 'dino' }, { id: 'fez', em: '🎩', medal: 'morocco' },
  { id: 'safari', em: '🧭', medal: 'jungle' }, { id: 'beanie', em: '🧶', medal: 'ice' }];
function hatUnlocked(h) {
  if (h.medal) return S.hats.includes(h.id);
  return S.stars >= h.need;
}
function renderWardrobe() {
  const h = S.hero;
  const mk = (box, list, cur, set) => {
    box.innerHTML = '';
    for (const c of list) {
      const s = document.createElement('div'); s.className = 'sw' + (c === cur ? ' sel' : ''); s.style.background = c;
      s.onclick = () => { Sfx.pop(); set(c); renderWardrobe(); };
      box.appendChild(s);
    }
  };
  mk($('#swShirt'), SHIRTS, S.shirt[h], c => { S.shirt[h] = c; save(); kids[h].setColors(S.shirt[h], S.hair[h]); kids[h].wave = 1; });
  mk($('#swHair'), HAIRS, S.hair[h], c => { S.hair[h] = c; save(); kids[h].setColors(S.shirt[h], S.hair[h]); });
  const ho = $('#hatOpts'); ho.innerHTML = '';
  for (const H of HATS) {
    const ok = hatUnlocked(H);
    const b = document.createElement('div');
    b.className = 'opt' + (S.hat === H.id ? ' sel' : '') + (ok ? '' : ' lock');
    b.textContent = `${H.em} ${H.id === 'none' ? T('none') : T('hat_' + H.id)}${ok ? '' : ' 🔒'}`;
    b.onclick = () => {
      if (!ok) { Sfx.soft(); toast(H.medal ? T('w_' + H.medal) + ' 🔒' : T('needStars', { n: H.need })); return; }
      Sfx.pop(); S.hat = H.id; save();
      kids.rayan.setHat(S.hat); kids.salma.setHat(S.hat); for (const k in worldCache) worldCache[k].setHat(S.hat);
      renderWardrobe();
    };
    ho.appendChild(b);
  }
}

// ------------------------------------------------ الجوائز
function renderRewards() {
  const ml = $('#medalList'); ml.innerHTML = '';
  const medals = WORLDS.map(W => ({ id: W.id, em: W.medalEm, name: T('medal_' + W.id), on: S.medals.includes(W.id) }));
  medals.push({ id: 'stars', em: '🌟', name: T('medal_stars') + ' (15⭐)', on: S.stars >= 15 });
  for (const m of medals) { const d = document.createElement('div'); d.className = 'medal' + (m.on ? '' : ' off'); d.innerHTML = `<div class="em">${m.em}</div>${m.name}`; ml.appendChild(d); }
  const hl = $('#hatList'); hl.innerHTML = '';
  for (const H of HATS.slice(1)) { const ok = hatUnlocked(H); const d = document.createElement('div'); d.className = 'medal' + (ok ? '' : ' off'); d.innerHTML = `<div class="em">${H.em}</div>${T('hat_' + H.id)}${ok ? '' : `<br><small>${H.medal ? T('w_' + H.medal) : T('needStars', { n: H.need })}</small>`}`; hl.appendChild(d); }
}

// ------------------------------------------------ الوالدين (بسؤال حساب)
let gateThen = null;
function gate(then) {
  const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 6);
  gate.ans = a + b;
  $('#gateQ').textContent = T('parentsGate', { a, b });
  $('#gateIn').value = '';
  $('#gate').classList.add('on');
  gateThen = then;
  setTimeout(() => $('#gateIn').focus(), 100);
}
$('#gateOk').addEventListener('click', () => {
  if (parseInt($('#gateIn').value, 10) === gate.ans) { $('#gate').classList.remove('on'); gateThen && gateThen(); }
  else { Sfx.soft(); $('#gateIn').value = ''; }
});
$('#gateNo').addEventListener('click', () => $('#gate').classList.remove('on'));
$('#btnParents').addEventListener('click', () => gate(() => show('parents')));
$('#restParents').addEventListener('click', () => gate(() => { $('#restModal').classList.remove('on'); show('parents'); }));
function renderParents() {
  $('#tgVoice').textContent = S.voice ? '🔊 ON' : '🔇 OFF';
  $('#tgMusic').textContent = S.music ? '🎵 ON' : '🔇 OFF';
  const L = $('#limits'); L.innerHTML = '';
  for (const m of [0, 15, 30, 45]) {
    const b = document.createElement('button'); b.className = 'btn small ' + (S.timeLimit === m ? 'purple' : 'blue');
    b.textContent = m ? `${m} ${T('minutes')}` : T('unlimited');
    b.onclick = () => { S.timeLimit = m; save(); renderParents(); };
    L.appendChild(b);
  }
  $('#played').textContent = T('playedToday', { m: S.playedDate === today() ? S.playedMin : 0 });
}
$('#tgVoice').addEventListener('click', () => { S.voice = !S.voice; save(); if (!S.voice) Voice.stop(); renderParents(); });
$('#tgMusic').addEventListener('click', () => { S.music = !S.music; save(); if (S.music) Music.start(); else Music.stop(); renderParents(); });
$('#btnReset').addEventListener('click', () => { if (confirm(T('resetConfirm'))) resetAll(); });

// ------------------------------------------------ مدة اللعب
setInterval(() => {
  if (screen !== 'hud' || document.hidden) return;
  if (S.playedDate !== today()) { S.playedDate = today(); S.playedMin = 0; }
  S.playedMin += 1; save();
  if (S.timeLimit && S.playedMin >= S.timeLimit) { Voice.stop(); show('map'); $('#restModal').classList.add('on'); }
}, 60000);

// ------------------------------------------------ الحلقة
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  menu.camera.aspect = w / h; menu.camera.updateProjectionMatrix();
  for (const k in worldCache) worldCache[k].resize(w, h);
}
addEventListener('resize', resize); resize();

const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (screen === 'hud') {
    keyboardJoy();
    if (cur) { cur.update(dt, t); cur.render(); }
  } else {
    const portrait = innerHeight > innerWidth;
    let camTarget, lookY = 1.3;
    if (menuView === 'one') {
      const k = kids[S.hero];
      kids.rayan.root.visible = S.hero === 'rayan'; kids.salma.root.visible = S.hero === 'salma';
      k.root.position.x += (0 - k.root.position.x) * 0.1;
      k.root.rotation.y = Math.sin(t * 0.6) * 0.6;
      camTarget = new THREE.Vector3(0, portrait ? 3.4 : 2.3, portrait ? 7.5 : 5.2); lookY = portrait ? 0.4 : 1.1;
    } else {
      kids.rayan.root.visible = kids.salma.root.visible = true;
      kids.rayan.root.position.x += (-1.3 - kids.rayan.root.position.x) * 0.1;
      kids.salma.root.position.x += (1.3 - kids.salma.root.position.x) * 0.1;
      for (const h of ['rayan', 'salma']) {
        const sel = screen === 'hero' && S.hero === h;
        kids[h].root.rotation.y = sel ? Math.sin(t * 2) * 0.25 : 0;
        const s = sel ? 1.12 : 1; kids[h].root.scale.setScalar(kids[h].root.scale.x + (s - kids[h].root.scale.x) * 0.15);
      }
      camTarget = new THREE.Vector3(0, portrait ? 3.6 : 2.6, portrait ? 11 : 7.5); lookY = portrait ? 1.6 : 1.2;
    }
    menu.camera.position.lerp(camTarget, 0.08);
    menu.camera.lookAt(0, lookY, 0);
    for (const h of ['rayan', 'salma']) { kids[h].speaking = Voice.speaking === h; kids[h].update(dt, t); }
    mbibo.speaking = Voice.speaking === 'bibo'; mbibo.update(dt, t);
    if (menuView === 'one') { mbibo.root.position.x += (1.9 - mbibo.root.position.x) * 0.05; mbibo.root.rotation.y = -0.5; }
    else { mbibo.root.position.x = Math.sin(t * 0.7) * 2.2; mbibo.root.rotation.y = Math.cos(t * 0.7) * 0.8; }
    mloulou.speaking = Voice.speaking === 'loulou'; mloulou.update(dt, t);
    renderer.render(menu.scene, menu.camera);
  }
  requestAnimationFrame(loop);
}
show('start');
loop();

// PWA: الخدمة ديال الأوفلاين
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.__ak = { get island() { return cur; }, S, show, startWorld, getWorld };
// للتجربة فقط (?debug)
if (location.search.includes('debug')) window.AK = { worldCache, getWorld, startWorld, replayWorld, show, S, get cur() { return cur; } };
