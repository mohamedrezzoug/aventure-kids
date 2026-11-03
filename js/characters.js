// عالم المغامرات – الشخصيات: ريان، سلمى، بيبو، لولو و الحيوانات (3D كرتوني)
import * as THREE from './three.module.js';

const matCache = new Map();
export function mat(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...opts }));
  return matCache.get(k);
}
function mesh(geo, m, x = 0, y = 0, z = 0, parent) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  if (parent) parent.add(o);
  return o;
}
const SPH = new THREE.SphereGeometry(1, 32, 24);
const SPH_LO = new THREE.SphereGeometry(1, 16, 12);

// عينين كبار بحال Pixar
function addEyes(parent, y, z, spread, size, look = 0) {
  const eyes = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(s * spread, y, z);
    parent.add(g);
    const white = mesh(SPH, mat('#ffffff', { roughness: 0.2 }), 0, 0, 0, g);
    white.scale.set(size, size * 1.15, size * 0.7);
    const iris = mesh(SPH, mat('#3a2a1a', { roughness: 0.3 }), look * size * 0.2, -size * 0.05, size * 0.5, g);
    iris.scale.set(size * 0.62, size * 0.7, size * 0.35);
    const pupil = mesh(SPH, mat('#0a0a0a', { roughness: 0.1 }), look * size * 0.2, -size * 0.05, size * 0.66, g);
    pupil.scale.set(size * 0.36, size * 0.42, size * 0.2);
    const hl = mesh(SPH_LO, mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }), size * 0.22, size * 0.25, size * 0.8, g);
    hl.scale.setScalar(size * 0.15);
    eyes.push(g);
  }
  return eyes;
}

function blinkUpdate(c, t) {
  if (!c.nextBlink) c.nextBlink = t + 2 + Math.random() * 3;
  let sy = 1;
  if (t > c.nextBlink) {
    const p = (t - c.nextBlink) / 0.16;
    if (p >= 1) c.nextBlink = t + 2 + Math.random() * 3.5;
    else sy = Math.max(0.08, Math.abs(1 - p * 2));
  }
  for (const e of c.eyes) e.scale.y = sy;
}

// ------------------------------------------------ ريان / سلمى
export function makeKid(opts) {
  const { girl = false, skin = '#f1c19a', hair = '#3b2414', shirt = '#e5533d', pants = '#2f4f8f', hat = 'none' } = opts;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const shirtM = mat(shirt), skinM = mat(skin), hairM = mat(hair, { roughness: 0.7 });

  // الجسم
  const torso = mesh(new THREE.CapsuleGeometry(0.34, 0.42, 8, 20), shirtM, 0, 0.98, 0, body);
  torso.scale.set(1, 1, 0.85);
  if (girl) {
    const skirt = mesh(new THREE.ConeGeometry(0.52, 0.55, 24, 1, true), shirtM, 0, 0.7, 0, body);
    skirt.material = mat(shirt, { side: THREE.DoubleSide });
  }
  // الرجلين
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.16, 0.68, 0); body.add(pivot);
    mesh(new THREE.CapsuleGeometry(0.12, 0.34, 6, 12), mat(girl ? skin : pants), 0, -0.3, 0, pivot);
    const shoe = mesh(SPH, mat('#f4f4f4'), 0, -0.56, 0.06, pivot); shoe.scale.set(0.15, 0.1, 0.22);
    legs.push(pivot);
  }
  // اليدين
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.42, 1.22, 0); body.add(pivot);
    mesh(new THREE.CapsuleGeometry(0.09, 0.32, 6, 12), shirtM, 0, -0.2, 0, pivot);
    mesh(SPH_LO, skinM, 0, -0.44, 0, pivot).scale.setScalar(0.11);
    pivot.rotation.z = s * 0.15;
    arms.push(pivot);
  }
  // الراس (كبير)
  const head = new THREE.Group(); head.position.set(0, 1.78, 0); body.add(head);
  const skull = mesh(SPH, skinM, 0, 0, 0, head); skull.scale.set(0.5, 0.48, 0.47);
  for (const s of [-1, 1]) { const ear = mesh(SPH_LO, skinM, s * 0.48, 0, 0, head); ear.scale.set(0.08, 0.12, 0.07); }
  const eyes = addEyes(head, 0.04, 0.36, 0.17, 0.13);
  const nose = mesh(SPH_LO, mat('#e9a983'), 0, -0.07, 0.47, head); nose.scale.set(0.05, 0.04, 0.04);
  const mouth = mesh(SPH_LO, mat('#7a2a2a'), 0, -0.2, 0.42, head); mouth.scale.set(0.09, 0.025, 0.04);
  for (const s of [-1, 1]) {
    const cheek = mesh(SPH_LO, mat('#ff8a8a', { transparent: true, opacity: 0.45 }), s * 0.27, -0.12, 0.37, head);
    cheek.scale.set(0.08, 0.05, 0.03); cheek.castShadow = false;
    const brow = mesh(new THREE.BoxGeometry(0.13, 0.03, 0.03), hairM, s * 0.17, 0.22, 0.42, head);
    brow.rotation.z = -s * 0.12;
  }
  // الشعر
  const hairCap = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), hairM, 0, 0.04, -0.02, head);
  hairCap.scale.set(0.53, 0.52, 0.51);
  hairCap.rotation.x = -0.25;
  if (girl) {
    for (const s of [-1, 1]) { const bun = mesh(SPH, hairM, s * 0.42, 0.18, -0.18, head); bun.scale.setScalar(0.17); }
    const tail = mesh(new THREE.CapsuleGeometry(0.11, 0.4, 6, 12), hairM, 0, -0.18, -0.42, head); tail.rotation.x = 0.4;
    const bow = mesh(SPH_LO, mat('#ff5fa2'), 0.3, 0.38, 0.05, head); bow.scale.set(0.12, 0.07, 0.05);
  } else {
    const fringe = mesh(SPH, hairM, 0.1, 0.33, 0.25, head); fringe.scale.set(0.3, 0.12, 0.2); fringe.rotation.z = 0.3;
  }
  // القبعة
  const hatG = new THREE.Group(); hatG.position.y = 0.32; head.add(hatG);
  function setHat(h) {
    hatG.clear();
    if (h === 'explorer') {
      mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 32), mat('#c8a165'), 0, 0.05, 0, hatG);
      mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.28, 32), mat('#c8a165'), 0, 0.2, 0, hatG);
      mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.07, 32), mat('#6b4423'), 0, 0.1, 0, hatG);
    } else if (h === 'crown') {
      mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 8, 1, true), mat('#ffd23f', { metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide }), 0, 0.12, 0, hatG);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        mesh(new THREE.ConeGeometry(0.06, 0.16, 6), mat('#ffd23f', { metalness: 0.6, roughness: 0.3 }), Math.cos(a) * 0.3, 0.29, Math.sin(a) * 0.3, hatG);
      }
      mesh(SPH_LO, mat('#e0245e'), 0, 0.14, 0.33, hatG).scale.setScalar(0.05);
    } else if (h === 'cap') {
      const c = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#2a7de1'), 0, -0.02, 0, hatG); c.scale.set(0.5, 0.32, 0.5);
      const visor = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 24, 1, false, -Math.PI / 2, Math.PI), mat('#2a7de1'), 0, -0.02, 0.32, hatG);
      visor.scale.set(1, 1, 0.9);
    } else if (h === 'party') { // قبعة الحفلة (مملكة الحلوى)
      mesh(new THREE.ConeGeometry(0.3, 0.7, 24), mat('#ff5fa2'), 0, 0.3, 0, hatG);
      for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.22 - i * 0.06, 0.03, 8, 24), mat(['#ffd23f', '#4cc9f0', '#80ed99'][i]), 0, 0.12 + i * 0.17, 0, hatG).rotation.x = Math.PI / 2;
      mesh(SPH_LO, mat('#ffffff'), 0, 0.68, 0, hatG).scale.setScalar(0.09);
    } else if (h === 'sailor') { // قبعة البحار (أعماق البحار)
      mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.22, 32), mat('#ffffff'), 0, 0.08, 0, hatG);
      mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 32), mat('#1d4e89'), 0, 0.02, 0, hatG);
      mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 32), mat('#ffffff'), 0, 0.2, 0, hatG);
    } else if (h === 'astro') { // خوذة الفضاء
      mesh(new THREE.SphereGeometry(0.62, 24, 16), mat('#dfe7ff', { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2 }), 0, -0.3, 0, hatG);
      mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 32), mat('#c0c8d8', { metalness: 0.6 }), 0, -0.78, 0, hatG).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), mat('#999'), 0.25, 0.4, 0, hatG);
      mesh(SPH_LO, mat('#ff4d6d', { emissive: '#ff0040', emissiveIntensity: 0.8 }), 0.25, 0.56, 0, hatG).scale.setScalar(0.05);
    } else if (h === 'dino') { // قبعة الديناصور بالقرون
      const c = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#4caf50'), 0, -0.02, 0, hatG); c.scale.set(0.5, 0.36, 0.5);
      for (let i = 0; i < 4; i++) { const sp = mesh(new THREE.ConeGeometry(0.07, 0.18, 6), mat('#ffb703'), 0, 0.26 - i * 0.03, 0.15 - i * 0.14, hatG); sp.rotation.x = -0.3 * i; }
    } else if (h === 'safari') { // خوذة السفاري (الغابة)
      mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 32), mat('#8a9a5b'), 0, 0.04, 0, hatG);
      const d = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#a3b18a'), 0, 0.04, 0, hatG); d.scale.set(0.4, 0.32, 0.4);
      mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.06, 32), mat('#588157'), 0, 0.08, 0, hatG);
    } else if (h === 'beanie') { // قبعة الصوف (القطب)
      const c = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e63946'), 0, -0.04, 0, hatG); c.scale.set(0.47, 0.42, 0.47);
      mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 28), mat('#ffffff'), 0, -0.02, 0, hatG);
      mesh(SPH_LO, mat('#ffffff'), 0, 0.42, 0, hatG).scale.setScalar(0.13);
    } else if (h === 'fez') { // الطربوش المغربي
      mesh(new THREE.CylinderGeometry(0.26, 0.33, 0.36, 28), mat('#c1121f'), 0, 0.14, 0, hatG);
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), mat('#111'), 0.12, 0.3, 0, hatG).rotation.z = -1.2;
      mesh(SPH_LO, mat('#111'), 0.24, 0.24, 0, hatG).scale.set(0.05, 0.1, 0.05);
    }
  }
  setHat(hat);
  function setColors(sh, hr) {
    shirtM.color.set(sh);
    hairM.color.set(hr);
  }

  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const c = { root, body, head, legs, arms, eyes, mouth, setHat, setColors, speaking: false, moving: 0, wave: 0 };
  c.update = (dt, t) => {
    const sp = c.moving;
    const sw = Math.sin(t * 10) * 0.7 * sp;
    legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
    arms[0].rotation.x = -sw * 0.8; arms[1].rotation.x = sw * 0.8;
    body.position.y = sp > 0.1 ? Math.abs(Math.sin(t * 10)) * 0.06 : Math.sin(t * 2) * 0.015;
    if (c.wave > 0) {
      c.wave -= dt;
      arms[1].rotation.z = 2.6 + Math.sin(t * 12) * 0.35;
      arms[1].rotation.x = 0;
    } else arms[1].rotation.z = 0.15;
    arms[0].rotation.z = -0.15;
    head.rotation.z = Math.sin(t * 1.3) * 0.04;
    blinkUpdate(c, t);
    mouth.scale.y = c.speaking ? 0.025 + Math.abs(Math.sin(t * 16)) * 0.07 : 0.025;
  };
  return c;
}

// ------------------------------------------------ بيبو: تنين صغير
export function makeBibo() {
  const root = new THREE.Group();
  const g = new THREE.Group(); root.add(g);
  const green = mat('#5cc96b'), belly = mat('#f3e7a1'), dark = mat('#3d9a4c');
  const bodyM = mesh(SPH, green, 0, 0, 0, g); bodyM.scale.set(0.42, 0.45, 0.4);
  const b2 = mesh(SPH, belly, 0, -0.03, 0.17, g); b2.scale.set(0.3, 0.34, 0.25);
  const head = new THREE.Group(); head.position.set(0, 0.55, 0.05); g.add(head);
  const sk = mesh(SPH, green, 0, 0, 0, head); sk.scale.set(0.4, 0.36, 0.36);
  const snout = mesh(SPH, green, 0, -0.08, 0.3, head); snout.scale.set(0.24, 0.17, 0.18);
  for (const s of [-1, 1]) {
    mesh(SPH_LO, dark, s * 0.08, -0.03, 0.46, head).scale.setScalar(0.025);
    const horn = mesh(new THREE.ConeGeometry(0.06, 0.2, 10), mat('#ffcf6b'), s * 0.17, 0.33, -0.05, head); horn.rotation.z = -s * 0.3;
  }
  const eyes = addEyes(head, 0.1, 0.24, 0.15, 0.12);
  const mouth = mesh(SPH_LO, mat('#8a2a3a'), 0, -0.17, 0.36, head); mouth.scale.set(0.1, 0.02, 0.05);
  for (const s of [-1, 1]) { const ch = mesh(SPH_LO, mat('#ff9a9a', { transparent: true, opacity: 0.5 }), s * 0.25, -0.07, 0.25, head); ch.scale.set(0.06, 0.04, 0.03); }
  // جوانح
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0); wingShape.quadraticCurveTo(0.35, 0.45, 0.7, 0.35); wingShape.quadraticCurveTo(0.55, 0.15, 0.62, 0.02);
  wingShape.quadraticCurveTo(0.4, 0.06, 0.3, -0.08); wingShape.quadraticCurveTo(0.15, 0, 0, 0);
  const wingGeo = new THREE.ShapeGeometry(wingShape);
  const wings = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 0.25, 0.15, -0.2); g.add(p);
    const w = mesh(wingGeo, mat('#9be08f', { side: THREE.DoubleSide }), 0, 0, 0, p);
    w.scale.x = s;
    wings.push(p);
  }
  // الذيل و الرجلين
  const tail = mesh(new THREE.ConeGeometry(0.12, 0.6, 12), green, 0, -0.2, -0.45, g); tail.rotation.x = -2.0;
  mesh(new THREE.ConeGeometry(0.07, 0.12, 4), mat('#ffcf6b'), 0, -0.07, -0.72, g).rotation.x = -2.0;
  for (const s of [-1, 1]) { const f = mesh(SPH_LO, dark, s * 0.18, -0.42, 0.1, g); f.scale.set(0.1, 0.07, 0.13); }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const c = { root, eyes, mouth, speaking: false };
  c.update = (dt, t) => {
    g.position.y = Math.sin(t * 3) * 0.12;
    wings[0].rotation.y = -0.4 - Math.sin(t * 14) * 0.6;
    wings[1].rotation.y = 0.4 + Math.sin(t * 14) * 0.6;
    head.rotation.z = Math.sin(t * 1.7) * 0.1;
    tail.rotation.y = Math.sin(t * 3) * 0.3;
    blinkUpdate(c, t);
    mouth.scale.y = c.speaking ? 0.02 + Math.abs(Math.sin(t * 18)) * 0.07 : 0.02;
  };
  return c;
}

// ------------------------------------------------ لولو: المرشدة (جنية صغيرة)
export function makeLoulou() {
  const root = new THREE.Group();
  const g = new THREE.Group(); root.add(g);
  const skin = mat('#d9a57e'), dress = mat('#a56de2'), hair = mat('#2b1a12');
  const skirt = mesh(new THREE.ConeGeometry(0.5, 0.9, 24), dress, 0, 0.75, 0, g);
  const top = mesh(new THREE.CapsuleGeometry(0.24, 0.25, 6, 16), dress, 0, 1.2, 0, g);
  const head = new THREE.Group(); head.position.set(0, 1.72, 0); g.add(head);
  mesh(SPH, skin, 0, 0, 0, head).scale.set(0.42, 0.41, 0.4);
  const hc = mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hair, 0, 0.03, -0.03, head); hc.scale.set(0.45, 0.45, 0.44); hc.rotation.x = -0.2;
  const back = mesh(new THREE.CapsuleGeometry(0.3, 0.45, 6, 16), hair, 0, -0.28, -0.22, head); back.scale.z = 0.6;
  const eyes = addEyes(head, 0.03, 0.3, 0.14, 0.11);
  const mouth = mesh(SPH_LO, mat('#a33a4a'), 0, -0.17, 0.36, head); mouth.scale.set(0.08, 0.02, 0.04);
  for (const s of [-1, 1]) { const ch = mesh(SPH_LO, mat('#ff8a9a', { transparent: true, opacity: 0.45 }), s * 0.23, -0.1, 0.31, head); ch.scale.set(0.07, 0.045, 0.03); }
  // تاج صغير ديال النجوم
  const tiara = mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), mat('#ffd23f', { emissive: '#ffb800', emissiveIntensity: 0.4 }), 0, 0.3, 0, head); tiara.rotation.x = Math.PI / 2 - 0.2;
  // يدين و العصا
  for (const s of [-1, 1]) {
    const arm = mesh(new THREE.CapsuleGeometry(0.07, 0.35, 6, 10), skin, s * 0.3, 1.15, 0.05, g); arm.rotation.z = s * 0.4;
  }
  const wand = new THREE.Group(); wand.position.set(0.48, 1.05, 0.2); g.add(wand);
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), mat('#ffffff'), 0, 0.2, 0, wand);
  const star = mesh(starGeometry(0.12, 0.06, 0.04), mat('#ffe14d', { emissive: '#ffcc00', emissiveIntensity: 0.9 }), 0, 0.48, 0, wand);
  // جوانح شفافة
  const wings = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 0.1, 1.3, -0.2); g.add(p);
    const w = mesh(SPH, mat('#bfe8ff', { transparent: true, opacity: 0.45, emissive: '#9fd8ff', emissiveIntensity: 0.4 }), s * 0.35, 0.1, -0.05, p);
    w.scale.set(0.38, 0.5, 0.03); w.castShadow = false;
    wings.push(p);
  }
  const light = new THREE.PointLight('#ffe9a8', 2.5, 5); light.position.set(0.5, 1.6, 0.4); g.add(light);
  root.traverse(o => { if (o.isMesh && o.castShadow !== false) o.castShadow = true; });
  const c = { root, eyes, mouth, speaking: false };
  c.update = (dt, t) => {
    g.position.y = 0.25 + Math.sin(t * 2) * 0.1;
    wings[0].rotation.y = 0.3 + Math.sin(t * 9) * 0.3;
    wings[1].rotation.y = -0.3 - Math.sin(t * 9) * 0.3;
    star.rotation.y = t * 2;
    wand.rotation.z = Math.sin(t * 2.5) * 0.2;
    blinkUpdate(c, t);
    mouth.scale.y = c.speaking ? 0.02 + Math.abs(Math.sin(t * 15)) * 0.06 : 0.02;
  };
  return c;
}

export function starGeometry(outer = 0.5, inner = 0.22, depth = 0.15) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: depth * 0.3, bevelThickness: depth * 0.3, bevelSegments: 2 });
  g.center();
  return g;
}

// ------------------------------------------------ الحيوانات
function legsQuad(parent, m, w, d, h, r) {
  const legs = [];
  for (const [x, z] of [[-w, d], [w, d], [-w, -d], [w, -d]]) {
    legs.push(mesh(new THREE.CylinderGeometry(r, r * 0.9, h, 10), m, x, h / 2, z, parent));
  }
  return legs;
}

export function makeAnimal(type) {
  const root = new THREE.Group();
  const g = new THREE.Group(); root.add(g);
  let head, extra = {};
  if (type === 'elephant') {
    const m = mat('#9aa3b5');
    const b = mesh(SPH, m, 0, 1.25, 0, g); b.scale.set(0.8, 0.7, 1.0);
    extra.legs = legsQuad(g, m, 0.42, 0.5, 0.75, 0.2);
    head = new THREE.Group(); head.position.set(0, 1.55, 0.95); g.add(head);
    mesh(SPH, m, 0, 0, 0, head).scale.set(0.55, 0.52, 0.5);
    extra.ears = [];
    for (const s of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(s * 0.45, 0.05, -0.1); head.add(p);
      const e = mesh(SPH, mat('#b4bccb'), s * 0.3, 0, 0, p); e.scale.set(0.4, 0.45, 0.08);
      extra.ears.push(p);
    }
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.1, 0.4), new THREE.Vector3(0, -0.5, 0.6), new THREE.Vector3(0, -0.9, 0.55), new THREE.Vector3(0, -1.05, 0.7)]);
    mesh(new THREE.TubeGeometry(curve, 20, 0.11, 10), m, 0, 0, 0, head);
    for (const s of [-1, 1]) { const t = mesh(new THREE.ConeGeometry(0.05, 0.3, 8), mat('#fffaf0'), s * 0.18, -0.3, 0.45, head); t.rotation.x = 2.2; }
    addEyes(head, 0.1, 0.4, 0.2, 0.09);
  } else if (type === 'giraffe') {
    const m = mat('#f2c14e'), spot = mat('#a0612a');
    const b = mesh(SPH, m, 0, 1.6, 0, g); b.scale.set(0.5, 0.45, 0.75);
    extra.legs = legsQuad(g, m, 0.25, 0.4, 1.3, 0.09);
    const neck = mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.5, 14), m, 0, 2.5, 0.45, g); neck.rotation.x = 0.35;
    head = new THREE.Group(); head.position.set(0, 3.3, 0.75); g.add(head);
    mesh(SPH, m, 0, 0, 0, head).scale.set(0.28, 0.26, 0.38);
    for (const s of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), spot, s * 0.1, 0.3, -0.05, head); mesh(SPH_LO, spot, s * 0.1, 0.43, -0.05, head).scale.setScalar(0.055); }
    addEyes(head, 0.08, 0.2, 0.15, 0.08);
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, y = 1.45 + Math.random() * 0.35;
      const sp = mesh(SPH_LO, spot, Math.cos(a) * 0.48, y, Math.sin(a) * 0.6, g); sp.scale.set(0.09, 0.09, 0.04); sp.lookAt(0, y, 0);
    }
  } else if (type === 'monkey') {
    const m = mat('#8b5a2b'), face = mat('#f1c99b');
    const b = mesh(SPH, m, 0, 0.75, 0, g); b.scale.set(0.38, 0.45, 0.35);
    mesh(SPH, face, 0, 0.72, 0.22, g).scale.set(0.25, 0.3, 0.15);
    head = new THREE.Group(); head.position.set(0, 1.4, 0.05); g.add(head);
    mesh(SPH, m, 0, 0, 0, head).scale.set(0.36, 0.34, 0.33);
    mesh(SPH, face, 0, -0.06, 0.2, head).scale.set(0.25, 0.22, 0.16);
    for (const s of [-1, 1]) { mesh(SPH, face, s * 0.36, 0.02, 0, head).scale.set(0.12, 0.13, 0.05); }
    addEyes(head, 0.06, 0.28, 0.11, 0.08);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.5, -0.3), new THREE.Vector3(0, 0.4, -0.7), new THREE.Vector3(0, 0.9, -0.9), new THREE.Vector3(0, 1.1, -0.65)]);
    extra.tail = mesh(new THREE.TubeGeometry(curve, 20, 0.05, 8), m, 0, 0, 0, g);
    extra.arms = [];
    for (const s of [-1, 1]) { const a = mesh(new THREE.CapsuleGeometry(0.07, 0.45, 6, 10), m, s * 0.38, 0.8, 0.05, g); a.rotation.z = s * 0.5; extra.arms.push(a); }
    for (const s of [-1, 1]) { mesh(new THREE.CapsuleGeometry(0.08, 0.3, 6, 10), m, s * 0.17, 0.25, 0.05, g); }
  } else if (type === 'turtle') {
    const shell = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#3f8f4f'), 0, 0.3, 0, g); shell.scale.set(0.75, 0.55, 0.85);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const p = mesh(SPH_LO, mat('#6cbf6a'), Math.cos(a) * 0.38, 0.62, Math.sin(a) * 0.42, g); p.scale.set(0.16, 0.06, 0.16);
    }
    mesh(SPH_LO, mat('#6cbf6a'), 0, 0.85, 0, g).scale.set(0.18, 0.06, 0.18);
    const skinT = mat('#9ad08a');
    head = new THREE.Group(); head.position.set(0, 0.45, 0.95); g.add(head);
    mesh(SPH, skinT, 0, 0, 0, head).scale.set(0.24, 0.22, 0.26);
    addEyes(head, 0.08, 0.18, 0.1, 0.07);
    extra.legs = [];
    for (const [x, z] of [[-0.55, 0.5], [0.55, 0.5], [-0.55, -0.5], [0.55, -0.5]]) { const l = mesh(SPH_LO, skinT, x, 0.22, z, g); l.scale.set(0.18, 0.12, 0.22); extra.legs.push(l); }
  } else if (type === 'rabbit') {
    const m = mat('#f7f2ee'), pink = mat('#ffb3c6');
    const b = mesh(SPH, m, 0, 0.55, 0, g); b.scale.set(0.38, 0.42, 0.45);
    mesh(SPH, m, 0, 0.45, -0.45, g).scale.setScalar(0.13);
    head = new THREE.Group(); head.position.set(0, 1.1, 0.25); g.add(head);
    mesh(SPH, m, 0, 0, 0, head).scale.set(0.32, 0.3, 0.3);
    extra.ears = [];
    for (const s of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(s * 0.12, 0.22, -0.05); head.add(p);
      mesh(new THREE.CapsuleGeometry(0.08, 0.45, 6, 10), m, 0, 0.3, 0, p);
      mesh(new THREE.CapsuleGeometry(0.045, 0.38, 6, 10), pink, 0, 0.3, 0.04, p);
      p.rotation.z = s * -0.15;
      extra.ears.push(p);
    }
    mesh(SPH_LO, pink, 0, -0.05, 0.3, head).scale.set(0.05, 0.04, 0.03);
    addEyes(head, 0.06, 0.24, 0.12, 0.075);
    for (const s of [-1, 1]) { const f = mesh(SPH_LO, m, s * 0.2, 0.12, 0.25, g); f.scale.set(0.1, 0.08, 0.2); }
  } else if (type === 'parrot') {
    const red = mat('#e63946');
    const perch = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), mat('#8b5a2b'), 0, 0.8, 0, g);
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), mat('#8b5a2b'), 0, 1.6, 0, g).rotation.z = Math.PI / 2;
    const b = mesh(SPH, red, 0, 1.95, 0, g); b.scale.set(0.24, 0.34, 0.24);
    head = new THREE.Group(); head.position.set(0, 2.35, 0.05); g.add(head);
    mesh(SPH, red, 0, 0, 0, head).scale.setScalar(0.2);
    const beak = mesh(new THREE.ConeGeometry(0.07, 0.18, 10), mat('#f4d35e'), 0, -0.04, 0.22, head); beak.rotation.x = Math.PI / 2 + 0.4;
    addEyes(head, 0.04, 0.13, 0.11, 0.06);
    extra.wings = [];
    for (const s of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(s * 0.2, 2.05, 0); g.add(p);
      const w = mesh(SPH, mat(s < 0 ? '#2a6fdb' : '#2a6fdb'), 0, -0.05, -0.05, p); w.scale.set(0.06, 0.28, 0.18);
      mesh(SPH_LO, mat('#ffd23f'), 0, -0.25, -0.08, p).scale.set(0.05, 0.12, 0.12);
      extra.wings.push(p);
    }
    const tail = mesh(new THREE.ConeGeometry(0.08, 0.5, 8), mat('#2a6fdb'), 0, 1.65, -0.18, g); tail.rotation.x = -2.7;
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const c = { root, head, type, jump: 0, happy: 0, speaking: false, eyes: [] };
  const phase = Math.random() * 10;
  c.update = (dt, t) => {
    const tt = t + phase;
    head.rotation.y = Math.sin(tt * 0.8) * 0.3;
    head.rotation.x = Math.sin(tt * 1.3) * 0.08;
    if (extra.ears) extra.ears.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * Math.sin(tt * 3) * 0.25; });
    if (extra.tail) extra.tail.rotation.z = Math.sin(tt * 2) * 0.2;
    if (extra.wings) extra.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.1 + Math.abs(Math.sin(tt * (c.happy > 0 ? 20 : 2))) * (c.happy > 0 ? 0.9 : 0.1)); });
    if (extra.arms && c.happy > 0) extra.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (2.5 + Math.sin(tt * 15) * 0.4); });
    else if (extra.arms) extra.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * 0.5; });
    let y = 0;
    if (c.jump > 0) { c.jump -= dt; y = Math.sin((1 - c.jump / 0.5) * Math.PI) * 0.5; }
    if (c.happy > 0) { c.happy -= dt; y = Math.abs(Math.sin(tt * 9)) * 0.45; }
    g.position.y = y + Math.sin(tt * 2) * 0.02;
  };
  return c;
}
