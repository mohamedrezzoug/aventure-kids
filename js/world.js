// عالم المغامرات – المحرك العام ديال العوالم (كل عالم = config ف worlds.js)
import * as THREE from './three.module.js';
import { mat, makeKid, makeBibo, makeLoulou, starGeometry } from './characters.js?v=7';
import { Voice, Sfx } from './audio.js?v=7';
import { S, save, worldState } from './state.js?v=7';
import { T } from './i18n.js?v=7';

export const ROUNDS = 3;
export function rand(a, b) { return a + Math.random() * (b - a); }
export function groundY(x, z) { const r = Math.hypot(x, z); return r < 25 ? 0.2 : 0; }

export class World {
  constructor(renderer, ui, cfg) {
    this.renderer = renderer;
    this.ui = ui; // { onKeys, onStars, onPrompt, onReward, onQuest, onWorldDone }
    this.cfg = cfg;
    this.id = cfg.id;
    this.Z = cfg.zones;
    this.ZO = cfg.order;
    this.CHEST = cfg.chest || new THREE.Vector3(0, 0, 22);
    this.SPAWN = cfg.spawn || new THREE.Vector3(0, 0, 11);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    this.ray = new THREE.Raycaster();
    this.obstacles = [];
    this.pickables = [];
    this.fx = [];
    this.collect = [];
    this.tickers = [];
    this.mode = 'play';
    this.joy = { x: 0, y: 0 };
    this.target = null;
    this.chatT = 30;
    this.chestCooldown = 0;
    this.build();
  }
  get st() { return worldState(this.id); }

  // ------------------------------------------------ بناء العالم
  build() {
    const sc = this.scene, th = this.cfg.theme;
    sc.background = new THREE.Color(th.bg);
    sc.fog = new THREE.Fog(th.fog, th.fogNear || 70, th.fogFar || 160);
    sc.add(new THREE.HemisphereLight(th.sky || '#d6f0ff', th.groundLight || '#c9a46b', th.hemi || 1.3));
    const sun = new THREE.DirectionalLight(th.sun || '#fff3d6', th.sunI || 2.4);
    sun.position.set(25, 40, 18);
    sun.castShadow = true;
    const sz = 36;
    Object.assign(sun.shadow.camera, { left: -sz, right: sz, top: sz, bottom: -sz, near: 1, far: 120 });
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    sc.add(sun);
    this.sun = sun;

    // الماء (إلا كان)
    if (th.sea) {
      const seaGeo = new THREE.PlaneGeometry(400, 400, 90, 90);
      seaGeo.rotateX(-Math.PI / 2);
      this.seaGeo = seaGeo;
      this.seaBase = seaGeo.attributes.position.array.slice();
      const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: th.sea, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.93 }));
      sea.position.y = -0.35; sea.receiveShadow = true; sc.add(sea);
    }
    // الحافة و الأرض
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(30, 34, 2, 72), mat(th.rim));
    rim.position.y = -1; rim.receiveShadow = true; sc.add(rim);
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(25, 25.6, 0.4, 72), mat(th.ground));
    ground.position.y = 0; ground.receiveShadow = true; sc.add(ground);
    this.ground = [rim, ground];
    if (th.patch) {
      for (let i = 0; i < 26; i++) {
        const a = rand(0, Math.PI * 2), r = rand(0, 22);
        const p = new THREE.Mesh(new THREE.CircleGeometry(rand(1, 2.6), 20), mat(th.patch));
        p.rotation.x = -Math.PI / 2; p.position.set(Math.cos(a) * r, 0.205, Math.sin(a) * r); p.receiveShadow = true; sc.add(p);
      }
    }
    // الزينة الخاصة بكل عالم
    if (this.cfg.decor) this.cfg.decor(this);
    // الكنز
    this.buildChest();
    // المناطق
    this.zoneObjs = {};
    for (const id of this.ZO) this.buildZone(id);
    // النجوم اللي كتجمع
    const sg = starGeometry(0.35, 0.16, 0.12);
    const sm = mat('#ffd23f', { emissive: '#ffb703', emissiveIntensity: 0.7, metalness: 0.3, roughness: 0.3 });
    for (let i = 0; i < 12; i++) {
      let x, z, ok = false, k = 0;
      while (!ok && k < 60) { const a = rand(0, Math.PI * 2), r = rand(5, 27); x = Math.cos(a) * r; z = Math.sin(a) * r; ok = !this.nearZone(x, z, 6) && !this.blocked(x, z, 1.5); k++; }
      const m = new THREE.Mesh(sg, sm); m.position.set(x, groundY(x, z) + 1.1, z); m.castShadow = true; sc.add(m);
      this.collect.push({ mesh: m, id: i });
    }
    // النجمة الكبيرة اللي كتوجه الطفل
    this.beacon = new THREE.Group();
    this.beacon.add(new THREE.Mesh(starGeometry(0.9, 0.42, 0.3), mat('#fff176', { emissive: '#ffd000', emissiveIntensity: 1 })));
    this.beacon.add(new THREE.PointLight('#ffe066', 6, 12));
    sc.add(this.beacon);
    // علامة اللمس
    this.tapRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }));
    this.tapRing.rotation.x = -Math.PI / 2; sc.add(this.tapRing);
    // الشخصيات
    this.loulou = makeLoulou();
    this.loulou.root.position.set(3.5, 0.2, 7.5);
    sc.add(this.loulou.root);
    this.pickables.push({ obj: this.loulou.root, kind: 'loulou' });
    this.bibo = makeBibo();
    sc.add(this.bibo.root);
    this.pickables.push({ obj: this.bibo.root, kind: 'bibo' });
  }

  // أدوات للزينة
  nearZone(x, z, d) {
    for (const id of this.ZO) { const p = this.Z[id].pos; if (Math.hypot(x - p.x, z - p.z) < d) return true; }
    return false;
  }
  blocked(x, z, pad = 0) {
    for (const o of this.obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + pad) return true;
    return false;
  }
  // بلاصة فارغة: بعيدة على المناطق و الكنز و البداية
  freeSpot(rMin, rMax, pad = 6, tries = 60) {
    for (let k = 0; k < tries; k++) {
      const a = rand(0, Math.PI * 2), r = rand(rMin, rMax);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (this.nearZone(x, z, pad + 1.5) || Math.hypot(x - this.CHEST.x, z - this.CHEST.z) < 5 || Math.hypot(x - this.SPAWN.x, z - this.SPAWN.z) < 5 || this.blocked(x, z, 1)) continue;
      return { x, z };
    }
    return null;
  }
  place(obj, x, z, r = 0) {
    obj.position.set(x, groundY(x, z), z);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.scene.add(obj);
    if (r) this.obstacles.push({ x, z, r });
    return obj;
  }
  scatter(n, rMin, rMax, maker, r = 0.8, pad = 6) {
    for (let i = 0; i < n; i++) { const p = this.freeSpot(rMin, rMax, pad); if (p) this.place(maker(i, p), p.x, p.z, r); }
  }
  tick(fn) { this.tickers.push(fn); }

  addPalm(x, z) {
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z);
    const h = rand(5, 7.5), lean = rand(-0.25, 0.25);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.28 - i * 0.025, 0.32 - i * 0.025, h / 6 + 0.08, 10), mat(i % 2 ? '#a0703f' : '#8b5e34'));
      s.position.set(lean * (i / 6) * h * 0.3, (i + 0.5) * h / 6, 0); s.castShadow = true; g.add(s);
    }
    const top = new THREE.Vector3(lean * h * 0.3, h, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6), mat(i % 2 ? '#3fa34d' : '#2f8f3f'));
      leaf.scale.set(0.45, 0.07, 1.9);
      const p = new THREE.Group(); p.position.copy(top); p.rotation.y = a; g.add(p);
      leaf.position.set(0, -0.35, 1.6); leaf.rotation.x = 0.45; leaf.castShadow = true; p.add(leaf);
    }
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat('#7a4b22')); c.position.copy(top).add(new THREE.Vector3(Math.cos(i * 2.1) * 0.25, -0.25, Math.sin(i * 2.1) * 0.25)); g.add(c); }
    this.scene.add(g);
    this.obstacles.push({ x, z, r: 0.6 });
  }
  addRock(x, z) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.5, 1.1), 0), mat('#9da3ad', { roughness: 0.9 }));
    r.position.set(x, groundY(x, z) + 0.2, z); r.rotation.set(rand(0, 3), rand(0, 3), 0); r.castShadow = true; r.receiveShadow = true;
    this.scene.add(r); this.obstacles.push({ x, z, r: 0.8 });
  }
  addBush(x, z) {
    const g = new THREE.Group(); g.position.set(x, groundY(x, z), z);
    const col = ['#4caf50', '#5cbf60', '#3e9e46'][Math.floor(rand(0, 3))];
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(rand(0.45, 0.7), 14, 10), mat(col)); b.position.set(rand(-0.4, 0.4), 0.35, rand(-0.4, 0.4)); b.castShadow = true; g.add(b); }
    if (Math.random() < 0.6) {
      const fc = ['#ff6b9a', '#ffd166', '#ffffff', '#c77dff'][Math.floor(rand(0, 4))];
      for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(fc)); f.position.set(rand(-0.5, 0.5), rand(0.6, 0.95), rand(-0.5, 0.5)); g.add(f); }
    }
    this.scene.add(g);
  }


  buildChest() {
    const g = new THREE.Group(); g.position.copy(this.CHEST); g.rotation.y = Math.PI;
    const wood = mat('#9c5b2e'), gold = mat('#ffcc33', { metalness: 0.7, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2, 1.1, 1.3), wood); base.position.y = 0.55; base.castShadow = true; g.add(base);
    for (const x of [-0.85, 0.85]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.12, 1.32), gold); b.position.set(x, 0.55, 0); g.add(b); }
    const lid = new THREE.Group(); lid.position.set(0, 1.1, -0.65); g.add(lid);
    const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 2, 24, 1, false, 0, Math.PI), wood);
    lm.rotation.z = Math.PI / 2; lm.rotation.y = Math.PI / 2; lm.position.set(0, 0, 0.65); lm.castShadow = true; lid.add(lm);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.1), gold); lock.position.set(0, 0.9, -0.68); g.add(lock);
    // كنوز داخل
    const inside = new THREE.Group(); inside.position.y = 1.05; inside.visible = false; g.add(inside);
    const gemCols = ['#ff4d6d', '#4cc9f0', '#80ed99', '#ffd60a', '#c77dff'];
    for (let i = 0; i < 18; i++) {
      const m = i % 3 === 0 ? new THREE.Mesh(new THREE.OctahedronGeometry(0.16), mat(gemCols[i % 5], { emissive: gemCols[i % 5], emissiveIntensity: 0.4 })) : new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), gold);
      m.position.set(rand(-0.7, 0.7), rand(0, 0.15), rand(-0.4, 0.4)); m.rotation.set(rand(0, 1), rand(0, 3), rand(0, 1)); inside.add(m);
    }
    // ثقب لكل مفتاح (عدد المناطق)
    this.keyholes = [];
    const nk = this.ZO.length, span = nk <= 3 ? 0.9 : 1.24;
    for (let i = 0; i < nk; i++) {
      const k = new THREE.Mesh(new THREE.CircleGeometry(nk <= 3 ? 0.12 : 0.1, 16), mat('#2b1a0e'));
      k.position.set(nk === 1 ? 0 : -span / 2 + i * span / (nk - 1), 0.45, -0.67); k.rotation.y = Math.PI; g.add(k); this.keyholes.push(k);
    }
    this.scene.add(g);
    this.chest = { g, lid, inside, open: false };
    this.obstacles.push({ x: this.CHEST.x, z: this.CHEST.z, r: 1.3 });
  }


  buildZone(id) {
    const Z = this.Z[id];
    const g = new THREE.Group(); g.position.copy(Z.pos); g.position.y = 0.2; this.scene.add(g);
    const ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 6, 48), new THREE.MeshBasicMaterial({ color: Z.ring || '#ffd166', transparent: true, opacity: 0.8 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(5.6, 48), mat(Z.floor || '#e9d8a6'));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; floor.receiveShadow = true; g.add(floor);
    const toCenter = new THREE.Vector3(-Z.pos.x, 0, -Z.pos.z).normalize();
    const baseAng = Math.atan2(-toCenter.x, -toCenter.z);
    const items = [];
    const n = Z.items.length;
    const spread = Z.spread || 2.2;
    Z.items.forEach((key, i) => {
      const a = baseAng + (i - (n - 1) / 2) * (spread / n) * 1.6;
      const r = 3.6;
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      const obj = Z.make(key, this, i);
      obj.root.position.set(x, 0, z);
      // اللوحات المسطحة كيشوفو كاملين للكاميرا، و الحيوانات كيشوفو للوسط
      obj.root.rotation.y = obj.flat ? Math.atan2(toCenter.x, toCenter.z) : Math.atan2(-x, -z);
      g.add(obj.root);
      obj.key = key;
      items.push(obj);
      this.pickables.push({ obj: obj.root, kind: 'item', zone: id, item: obj });
      this.obstacles.push({ x: Z.pos.x + x, z: Z.pos.z + z, r: 0.7 });
    });
    this.zoneObjs[id] = { g, items, ring, toCenter };
  }

  // ------------------------------------------------ البداية
  start(heroType) {
    if (this.hero) this.scene.remove(this.hero.root);
    const girl = heroType === 'salma';
    this.hero = makeKid({ girl, shirt: S.shirt[heroType], hair: S.hair[heroType], skin: girl ? '#e8b48e' : '#f1c19a', hat: S.hat });
    this.heroType = heroType;
    this.hero.root.position.copy(this.SPAWN); this.hero.root.position.y = groundY(this.SPAWN.x, this.SPAWN.z);
    this.hero.root.rotation.y = Math.PI;
    this.scene.add(this.hero.root);
    this.bibo.root.position.set(this.SPAWN.x - 1.5, 1.6, this.SPAWN.z + 0.5);
    this.mode = 'play';
    this.target = null;
    this.puzzle = null;
    for (const c of this.collect) c.mesh.visible = !this.st.starsPicked.includes(c.id);
    this.refreshChest();
    this.camPos = this.hero.root.position.clone().add(new THREE.Vector3(0, 9, 12));
    this.camera.position.copy(this.camPos);
    this.lookAt = null;
    this.ui.onKeys(this.st.keys.length);
    this.ui.onStars(S.stars);
    this.updateQuest();
    const L = this.cfg.lines;
    if (!this.st.intro) {
      this.st.intro = true; save();
      setTimeout(async () => {
        await Voice.say(L.welcome);
        await Voice.say(L.mission);
        await Voice.say('bibo_follow');
      }, 700);
    } else {
      setTimeout(() => Voice.say('bibo_hi'), 600);
    }
  }

  refreshChest() {
    const n = this.st.keys.length;
    this.keyholes.forEach((k, i) => { k.material = i < n ? mat('#ffcc33', { emissive: '#ffaa00', emissiveIntensity: 0.8 }) : mat('#2b1a0e'); });
    if (this.st.done && !this.chest.open) { this.chest.open = true; this.chest.lid.rotation.x = -1.9; this.chest.inside.visible = true; }
  }

  // نعاودو اللعبة من الأول (المفاتيح، الكنز، النجوم ديال هاد العالم)
  resetProgress() {
    const st = this.st;
    st.keys = []; st.done = false; st.zoneStars = {}; st.starsPicked = []; st.intro = false;
    st.plays = (st.plays || 0) + 1;
    save();
    this.fx = this.fx.filter(f => { if (f.kind !== 'lid') this.scene.remove(f.obj); return false; });
    this.chest.open = false; this.chest.lid.rotation.x = 0; this.chest.inside.visible = false;
    this.mode = 'play'; this.puzzle = null;
    // نخلطو الأسئلة شوية: كل منطقة كتبدل بلاصات الأشياء ديالها
    for (const id of this.ZO) {
      const zo = this.zoneObjs[id], ps = zo.items.map(it => it.root.position.clone());
      for (let i = ps.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ps[i], ps[j]] = [ps[j], ps[i]]; }
      zo.items.forEach((it, i) => { it.root.position.copy(ps[i]); if (!it.flat) it.root.rotation.y = Math.atan2(-ps[i].x, -ps[i].z); });
      // الحواجز ديال الأشياء كتبقى صحيحة (نفس البلايص)
    }
  }

  currentObjective() {
    for (const id of this.ZO) if (!this.st.keys.includes(id)) return { type: 'zone', id, pos: this.Z[id].pos };
    if (!this.st.done) return { type: 'chest', pos: this.CHEST };
    return null;
  }
  updateQuest() {
    if (this.mode === 'puzzle' && this.puzzle) { this.ui.onQuest(`${T('quest1', { n: this.ZO.length })}  •  ${T('zone_' + this.puzzle.id)}`); return; }
    const o = this.currentObjective();
    if (!o) this.ui.onQuest(T(this.cfg.questDone || 'quest3'));
    else if (o.type === 'zone') this.ui.onQuest(`${T('quest1', { n: this.ZO.length })}  •  ${T('zone_' + o.id)}`);
    else this.ui.onQuest(T(this.cfg.questChest || 'quest2'));
  }

  setHat(h) { if (this.hero) this.hero.setHat(h); }

  // ------------------------------------------------ اللمس
  tap(nx, ny) {
    this.ray.setFromCamera({ x: nx, y: ny }, this.camera);
    const objs = this.pickables.map(p => p.obj);
    const hits = this.ray.intersectObjects(objs, true);
    if (hits.length) {
      const o = hits[0].object;
      const found = this.pickables.find(p => { let x = o; while (x) { if (x === p.obj) return true; x = x.parent; } return false; });
      if (found) { this.onPick(found); return; }
    }
    if (this.mode !== 'play') return;
    const gh = this.ray.intersectObjects(this.ground, false);
    if (gh.length) {
      const p = gh[0].point;
      this.target = new THREE.Vector3(p.x, 0, p.z);
      this.tapRing.position.set(p.x, groundY(p.x, p.z) + 0.03, p.z);
      this.tapRing.material.opacity = 0.9; this.tapRing.scale.setScalar(1);
      Sfx.tap();
    }
  }

  chatLine() { const c = this.cfg.lines.chat; return c[Math.floor(Math.random() * c.length)]; }
  onPick(p) {
    if (p.kind === 'item' && this.mode === 'puzzle' && p.zone === this.puzzle.id) { this.answer(p.item); return; }
    if (this.mode !== 'play') return;
    const L = this.cfg.lines;
    if (p.kind === 'bibo') { Sfx.pop(); Voice.say(this.chatLine()); }
    else if (p.kind === 'loulou') { Sfx.pop(); Voice.say(this.st.keys.length < this.ZO.length ? L.mission : (this.st.done ? this.chatLine() : L.allKeys)); }
    else if (p.kind === 'item') {
      p.item.happy = 1; Sfx.pop();
      const Z = this.Z[p.zone];
      const h = Z.hello ? Z.hello(p.item.key) : null;
      if (h) Voice.say(h[0], h[1]);
    }
  }

  // ------------------------------------------------ الألغاز
  startPuzzle(id) {
    this.mode = 'puzzle';
    this.target = null;
    this.puzzleCam = null;
    this.puzzle = { id, round: 0, mistakes: 0, last: null, goal: null, ask: null, busy: true };
    const Z = this.Z[id];
    const tc = this.zoneObjs[id].toCenter;
    this.hero.root.position.set(Z.pos.x + tc.x * 2.4, 0.2, Z.pos.z + tc.z * 2.4);
    this.hero.root.rotation.y = Math.atan2(-tc.x, -tc.z);
    this.ui.onPrompt('');
    this.updateQuest();
    this.fitPuzzleCam();
    Voice.say(Z.intro).then(() => this.nextQuestion());
  }
  // الكاميرا كتبعد حتى يبانو جميع الأشياء كاملين فوق صندوق الكلام
  fitPuzzleCam() {
    if (!this.puzzle) return;
    const id = this.puzzle.id, zo = this.zoneObjs[id], tc = zo.toCenter;
    const pts = [];
    const c = new THREE.Vector3();
    const box = new THREE.Box3();
    zo.g.updateMatrixWorld(true);
    for (const it of zo.items) {
      box.setFromObject(it.root);
      c.add(box.getCenter(new THREE.Vector3()).setY(it.root.getWorldPosition(new THREE.Vector3()).y));
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z));
    }
    c.multiplyScalar(1 / zo.items.length);
    const cam = this.camera.clone();
    let best = null;
    for (let d = 5; d <= 40; d += 0.5) {
      const pos = c.clone().add(tc.clone().multiplyScalar(d * 0.8)).add(new THREE.Vector3(0, d * 0.6, 0));
      const look = c.clone().add(new THREE.Vector3(0, 0.9 - d * 0.06, 0));
      cam.position.copy(pos); cam.lookAt(look); cam.updateMatrixWorld();
      let ok = true;
      for (const p of pts) {
        const v = p.clone().project(cam);
        if (v.x < -0.9 || v.x > 0.9 || v.y < -0.2 || v.y > 0.64) { ok = false; break; }
      }
      best = { pos, look };
      if (ok) break;
    }
    this.puzzleCam = best;
  }
  // السؤال: كل منطقة يمكن ليها تعطي سؤال خاص (ask)، و إلا "فين X؟"
  makeAsk(Z, pz) {
    if (Z.ask) return Z.ask(pz, Z);
    const opts = Z.items.filter(k => k !== pz.last);
    const goal = opts[Math.floor(Math.random() * opts.length)];
    return { goal, line: Z.line, x: goal };
  }
  nextQuestion() {
    const pz = this.puzzle; if (!pz) return;
    const Z = this.Z[pz.id];
    const a = this.makeAsk(Z, pz);
    pz.goal = a.goal; pz.ask = a; pz.last = a.goal;
    pz.busy = false;
    this.ui.onPrompt(`${pz.round + 1}/${ROUNDS}`);
    Voice.say(a.line, a.x);
  }
  repeatQuestion() {
    if (this.mode === 'puzzle' && this.puzzle && this.puzzle.ask) Voice.say(this.puzzle.ask.line, this.puzzle.ask.x);
  }
  answer(item) {
    const pz = this.puzzle;
    if (!pz || pz.busy) return;
    const Z = this.Z[pz.id];
    if (item.key === pz.goal) {
      pz.busy = true;
      item.happy = 1.5;
      Sfx.good();
      this.burst(item.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.5, 0)), 18);
      pz.round++;
      Voice.say('bravo_' + (1 + Math.floor(Math.random() * 3))).then(() => {
        if (pz.round >= ROUNDS) this.solve(); else setTimeout(() => this.nextQuestion(), 300);
      });
    } else {
      pz.mistakes++;
      item.jump = 0.5;
      Sfx.soft();
      pz.busy = true;
      const w = Z.wrong ? (typeof Z.wrong === 'function' ? Z.wrong(item.key) : [Z.wrong, item.key]) : null;
      const first = w ? Voice.say(w[0], w[1]) : Promise.resolve();
      first.then(() => Voice.say('try_again')).then(() => { pz.busy = false; Voice.say(pz.ask.line, pz.ask.x); });
    }
  }
  solve() {
    const id = this.puzzle.id;
    const stars = Math.max(1, 3 - this.puzzle.mistakes);
    const st = this.st;
    st.zoneStars[id] = stars;
    S.stars += stars;
    if (!st.keys.includes(id)) st.keys.push(id);
    save();
    this.ui.onStars(S.stars);
    this.ui.onPrompt('');
    const key = this.makeKey();
    const zp = this.Z[id].pos;
    key.position.set(zp.x, 1, zp.z);
    this.scene.add(key);
    this.fx.push({ obj: key, t: 0, life: 2.2, kind: 'key' });
    this.burst(new THREE.Vector3(zp.x, 2, zp.z), 40);
    Sfx.key();
    this.mode = 'play';
    this.puzzle = null;
    this.ui.onKeys(st.keys.length);
    this.ui.onReward(`🗝️ +1   ⭐ +${stars}`);
    this.refreshChest();
    this.updateQuest();
    Voice.say('key_found').then(() => { if (st.keys.length === this.ZO.length) Voice.say(this.cfg.lines.allKeys); });
  }
  makeKey() {
    const g = new THREE.Group();
    const gold = mat('#ffcc33', { metalness: 0.8, roughness: 0.25, emissive: '#ffaa00', emissiveIntensity: 0.4 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 12, 24), gold); ring.position.y = 0.5; g.add(ring);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 10), gold); shaft.position.y = -0.2; g.add(shaft);
    for (const y of [-0.5, -0.32]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.08), gold); t.position.set(0.13, y, 0); g.add(t); }
    return g;
  }

  openChest() {
    const CH = this.CHEST;
    this.mode = 'cinematic';
    this.chest.open = true;
    this.chest.inside.visible = true;
    Sfx.fanfare();
    this.cine = { t: 0 };
    const hp0 = this.hero.root.position;
    hp0.set(CH.x - 2.3, groundY(CH.x - 2.3, CH.z - 0.6), CH.z - 0.6);
    this.hero.root.rotation.y = Math.atan2(CH.x - hp0.x, CH.z - hp0.z);
    this.hero.wave = 2;
    this.target = null;
    this.fx.push({ obj: this.chest.lid, t: 0, life: 1.2, kind: 'lid' });
    setTimeout(() => this.burst(CH.clone().add(new THREE.Vector3(0, 1.5, 0)), 70, true), 500);
    this.st.done = true;
    if (!S.medals.includes(this.cfg.medal)) S.medals.push(this.cfg.medal);
    if (this.cfg.hat && !S.hats.includes(this.cfg.hat)) S.hats.push(this.cfg.hat);
    save();
    this.updateQuest();
    Voice.say(this.cfg.lines.chestOpen).then(() => {
      setTimeout(() => { this.mode = 'play'; this.ui.onWorldDone(this.id); }, 600);
    });
  }

  // ------------------------------------------------ مؤثرات
  burst(pos, n, big = false) {
    const cols = ['#ffd23f', '#ff6b9a', '#4cc9f0', '#80ed99', '#ffffff', '#c77dff'];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(i % 4 === 0 ? starGeometry(0.12, 0.05, 0.04) : new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], transparent: true }));
      m.position.copy(pos);
      const v = new THREE.Vector3(rand(-1, 1), rand(0.6, 1.6), rand(-1, 1)).normalize().multiplyScalar(rand(3, big ? 9 : 6));
      this.scene.add(m);
      this.fx.push({ obj: m, v, t: 0, life: rand(0.8, 1.4), kind: 'p' });
    }
  }

  resize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); if (this.mode === 'puzzle') this.fitPuzzleCam(); }

  update(dt, t) {
    const hero = this.hero; if (!hero) return;
    const hp = hero.root.position;
    // البحر كيتحرك
    if (this.seaGeo) {
      const pos = this.seaGeo.attributes.position; const arr = pos.array; const b = this.seaBase;
      for (let i = 0; i < arr.length; i += 3) arr[i + 1] = b[i + 1] + Math.sin(b[i] * 0.15 + t * 1.2) * 0.18 + Math.cos(b[i + 2] * 0.12 + t * 0.9) * 0.15;
      pos.needsUpdate = true;
    }
    for (const f of this.tickers) f(dt, t, this);

    // الحركة
    let move = new THREE.Vector3();
    if (this.mode === 'play') {
      if (Math.abs(this.joy.x) > 0.1 || Math.abs(this.joy.y) > 0.1) { move.set(this.joy.x, 0, this.joy.y); this.target = null; }
      else if (this.target) {
        move.set(this.target.x - hp.x, 0, this.target.z - hp.z);
        if (move.length() < 0.25) { this.target = null; move.set(0, 0, 0); }
      }
    }
    const speed = 5.2;
    if (move.lengthSq() > 0.0001) {
      const m = Math.min(1, move.length());
      move.normalize();
      const nx = hp.x + move.x * speed * m * dt, nz = hp.z + move.z * speed * m * dt;
      let ok = Math.hypot(nx, nz) < 29.3;
      for (const o of this.obstacles) if (Math.hypot(nx - o.x, nz - o.z) < o.r + 0.35) { ok = false; break; }
      if (ok) { hp.x = nx; hp.z = nz; }
      else { // دور على العائق: جرب اتجاهات مايلة
        let moved = false;
        const step = speed * m * dt;
        for (const da of [0.5, -0.5, 1.0, -1.0, 1.5, -1.5]) {
          const c = Math.cos(da), s = Math.sin(da);
          const dx = move.x * c - move.z * s, dz = move.x * s + move.z * c;
          const tx = hp.x + dx * step, tz = hp.z + dz * step;
          if (Math.hypot(tx, tz) < 29.3 && !this.blocked(tx, tz, 0.35)) { hp.x = tx; hp.z = tz; moved = true; break; }
        }
        if (!moved) this.target = null;
      }
      const ang = Math.atan2(move.x, move.z);
      let d = ang - hero.root.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      hero.root.rotation.y += d * Math.min(1, dt * 10);
      hero.moving = Math.min(1, hero.moving + dt * 6) * m;
    } else hero.moving = Math.max(0, hero.moving - dt * 6);
    hp.y = groundY(hp.x, hp.z);

    // لولو كتشوف الطفل
    const lp = this.loulou.root.position;
    this.loulou.root.rotation.y = Math.atan2(hp.x - lp.x, hp.z - lp.z);
    // بيبو كيتبع
    const bp = this.bibo.root.position;
    const side = new THREE.Vector3(Math.cos(hero.root.rotation.y), 0, -Math.sin(hero.root.rotation.y));
    const want = hp.clone().add(side.multiplyScalar(1.4)).add(new THREE.Vector3(0, 1.7, 0)).sub(new THREE.Vector3(Math.sin(hero.root.rotation.y), 0, Math.cos(hero.root.rotation.y)).multiplyScalar(0.8));
    bp.lerp(want, Math.min(1, dt * 2.5));
    this.bibo.root.rotation.y = this.mode === 'puzzle' ? Math.atan2(this.camera.position.x - bp.x, this.camera.position.z - bp.z) : hero.root.rotation.y;

    // الكلام (الفم)
    hero.speaking = Voice.speaking === this.heroType;
    this.bibo.speaking = Voice.speaking === 'bibo';
    this.loulou.speaking = Voice.speaking === 'loulou' || (Voice.speaking === 'salma' && this.heroType !== 'salma');
    if (Voice.speaking === 'salma' && this.heroType === 'salma') hero.speaking = true;

    hero.update(dt, t); this.bibo.update(dt, t); this.loulou.update(dt, t);
    for (const id of this.ZO) for (const it of this.zoneObjs[id].items) it.update(dt, t);
    for (const id of this.ZO) { const zr = this.zoneObjs[id].ring; zr.material.opacity = this.st.keys.includes(id) ? 0.25 : 0.55 + Math.sin(t * 3) * 0.3; }

    // دخول للمنطقة
    if (this.mode === 'play') {
      for (const id of this.ZO) {
        if (this.st.keys.includes(id)) continue;
        const z = this.Z[id].pos;
        if (Math.hypot(hp.x - z.x, hp.z - z.z) < 4.6) { this.startPuzzle(id); break; }
      }
      // الكنز
      this.chestCooldown -= dt;
      if (!this.chest.open && Math.hypot(hp.x - this.CHEST.x, hp.z - this.CHEST.z) < 2.6) {
        if (this.st.keys.length >= this.ZO.length) this.openChest();
        else if (this.chestCooldown <= 0) { this.chestCooldown = 8; Voice.say('chest_locked', { n: 'n' + this.ZO.length }); }
      }
      // النجوم
      for (const c of this.collect) {
        if (!c.mesh.visible) continue;
        c.mesh.rotation.y = t * 2; c.mesh.position.y = groundY(c.mesh.position.x, c.mesh.position.z) + 1.1 + Math.sin(t * 3 + c.id) * 0.15;
        if (Math.hypot(hp.x - c.mesh.position.x, hp.z - c.mesh.position.z) < 1.3) {
          c.mesh.visible = false; this.st.starsPicked.push(c.id); S.stars += 1; save();
          Sfx.star(); this.burst(c.mesh.position.clone(), 12); this.ui.onStars(S.stars);
          if (Math.random() < 0.35) Voice.say('star_pick');
        }
      }
      // بيبو كيهضر شي مرات
      this.chatT -= dt;
      if (this.chatT <= 0) { this.chatT = 40 + Math.random() * 30; if (!Voice.speaking) Voice.say(this.chatLine()); }
    }

    // النجمة الدليل
    const obj = this.currentObjective();
    this.beacon.visible = !!obj && this.mode === 'play';
    if (obj) { this.beacon.position.set(obj.pos.x, 6.5 + Math.sin(t * 2) * 0.4, obj.pos.z); this.beacon.rotation.y = t * 1.5; }
    // علامة اللمس
    if (this.tapRing.material.opacity > 0) { this.tapRing.material.opacity -= dt * 1.5; this.tapRing.scale.multiplyScalar(1 + dt * 1.5); }

    // المؤثرات
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t += dt;
      const k = f.t / f.life;
      if (f.kind === 'p') {
        f.v.y -= 9 * dt; f.obj.position.addScaledVector(f.v, dt); f.obj.rotation.x += dt * 5; f.obj.material.opacity = 1 - k;
      } else if (f.kind === 'key') {
        f.obj.rotation.y = t * 6;
        if (k < 0.5) f.obj.position.y = 1 + k * 2 * 3;
        else f.obj.position.lerp(hp.clone().add(new THREE.Vector3(0, 2, 0)), Math.min(1, dt * 6));
        f.obj.scale.setScalar(k < 0.8 ? 1.4 : 1.4 * (1 - (k - 0.8) * 5));
      } else if (f.kind === 'lid') {
        f.obj.rotation.x = -1.9 * Math.min(1, k * 1.2);
      }
      if (k >= 1) { if (f.kind !== 'lid') { this.scene.remove(f.obj); } this.fx.splice(i, 1); }
    }
    if (this.chest.open) this.chest.inside.children.forEach((c, i) => { c.rotation.y += dt * (i % 2 ? 1 : -1); });

    // الكاميرا
    let camWant, look;
    if (this.mode === 'puzzle' && this.puzzle) {
      const z = this.Z[this.puzzle.id].pos, tc = this.zoneObjs[this.puzzle.id].toCenter;
      if (!this.puzzleCam) this.fitPuzzleCam();
      camWant = this.puzzleCam.pos; look = this.puzzleCam.look;
    } else if (this.mode === 'cinematic') {
      this.cine.t += dt;
      const a = 0.9 + this.cine.t * 0.35;
      const tH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
      const cd = Math.min(16, Math.max(7, 2.6 / tH));
      camWant = this.CHEST.clone().add(new THREE.Vector3(Math.sin(a) * cd, cd * 0.55 + Math.sin(this.cine.t) * 0.5, -Math.cos(a) * cd));
      look = this.CHEST.clone().add(new THREE.Vector3(0, 1.2, 0));
    } else {
      camWant = hp.clone().add(new THREE.Vector3(0, 8.5, 11));
      look = hp.clone().add(new THREE.Vector3(0, 1.2, 0));
    }
    this.camPos.lerp(camWant, Math.min(1, dt * (this.mode === 'play' ? 4 : 2.5)));
    this.camera.position.copy(this.camPos);
    if (!this.lookAt) this.lookAt = look.clone();
    this.lookAt.lerp(look, Math.min(1, dt * 5));
    this.camera.lookAt(this.lookAt);
    // الشمس كتبع الطفل باش الظل يبقى واضح
    this.sun.target.position.copy(hp); this.sun.position.copy(hp).add(new THREE.Vector3(25, 40, 18)); this.sun.target.updateMatrixWorld();
  }


  render() { this.renderer.render(this.scene, this.camera); }
}
