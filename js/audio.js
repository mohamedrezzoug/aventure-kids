// عالم المغامرات – الأصوات: كلام الشخصيات (تسجيل ولا صوت الجهاز)، المؤثرات و الموسيقى
import { lang, lineText, LINES } from './i18n.js?v=7';
import { S } from './state.js?v=7';

// شخصية كل صوت: pitch و rate
const VOICE_STYLE = {
  bibo: { pitch: 1.7, rate: 1.0 },
  loulou: { pitch: 1.25, rate: 0.95 },
  rayan: { pitch: 1.15, rate: 1.0 },
  salma: { pitch: 1.4, rate: 1.0 },
};

let recorded = { ar: [], fr: [] }; // اللائحة ديال الجمل المسجلة (audio/manifest.json)
fetch('audio/manifest.json').then(r => (r.ok ? r.json() : null)).then(j => { if (j) recorded = j; }).catch(() => {});

let voices = [];
function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice(l) {
  const pref = l === 'ar' ? ['ar-MA', 'ar-SA', 'ar'] : ['fr-FR', 'fr'];
  for (const p of pref) {
    const v = voices.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(p.toLowerCase()));
    if (v) return v;
  }
  return null;
}

let currentAudio = null;
let speakToken = 0;

export const Voice = {
  speaking: null, // شكون كيهضر دابا (باش يتحرك الفم)
  onLine: null,   // callback(who, text) باش تبان الفقاعة
  stop() {
    speakToken++;
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    this.speaking = null;
  },
  // id = مفتاح ف LINES، x = كلمة اختيارية
  say(id, x) {
    const e = LINES[id];
    if (!e) return Promise.resolve();
    const text = lineText(id, x);
    const who = e.who;
    if (this.onLine) this.onLine(who, text, id, x);
    this.stop();
    const token = speakToken;
    this.speaking = who;
    const done = () => { if (token === speakToken) this.speaking = null; };
    const fallbackMs = 900 + text.length * 70;
    if (!S.voice) return new Promise(r => setTimeout(() => { done(); r(); }, fallbackMs));
    const recId = x ? (typeof x === 'object' ? `${id}_${Object.values(x).join('_')}` : `${id}_${x}`) : id;
    const list = recorded[lang] || [];
    if (list.includes(recId)) {
      return new Promise(res => {
        const a = new Audio(`audio/${lang}/${recId}.mp3`);
        currentAudio = a;
        a.onended = () => { done(); res(); };
        a.onerror = () => { done(); res(); };
        a.play().catch(() => { done(); res(); });
      });
    }
    if (!window.speechSynthesis) return new Promise(r => setTimeout(() => { done(); r(); }, fallbackMs));
    return new Promise(res => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'ar' ? 'ar-SA' : 'fr-FR';
      const v = pickVoice(lang);
      if (v) u.voice = v;
      const st = VOICE_STYLE[who] || { pitch: 1, rate: 1 };
      u.pitch = st.pitch; u.rate = st.rate * (lang === 'ar' ? 0.92 : 1);
      let finished = false;
      const fin = () => { if (finished) return; finished = true; done(); res(); };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, fallbackMs + 4000);
      speechSynthesis.speak(u);
    });
  },
};

// ---------------- المؤثرات الصوتية (WebAudio، بلا ملفات)
let ctx = null;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, start, dur, type = 'sine', vol = 0.2, slideTo = null) {
  const c = ac(); if (!c || !S.sfx) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
}
export const Sfx = {
  unlock() { ac(); },
  tap() { tone(660, 0, 0.08, 'triangle', 0.15); },
  pop() { tone(500, 0, 0.12, 'sine', 0.2, 900); },
  star() { tone(1046, 0, 0.12, 'triangle', 0.18); tone(1568, 0.08, 0.2, 'triangle', 0.15); },
  good() { [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.2)); },
  soft() { tone(330, 0, 0.18, 'sine', 0.15, 260); },
  key() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.3, 'triangle', 0.18)); },
  fanfare() {
    const n = [523, 523, 659, 784, 659, 784, 1046];
    n.forEach((f, i) => tone(f, i * 0.14, i === n.length - 1 ? 0.8 : 0.16, 'square', 0.08));
    n.forEach((f, i) => tone(f / 2, i * 0.14, 0.16, 'triangle', 0.12));
  },
  step() { tone(120, 0, 0.05, 'sine', 0.04); },
};

// ---------------- موسيقى هادئة (pentatonic)
let musicTimer = null;
const SCALE = [392, 440, 523, 587, 659, 784, 880];
export const Music = {
  start() {
    if (musicTimer || !S.music) return;
    let step = 0;
    musicTimer = setInterval(() => {
      const c = ac(); if (!c || !S.music) return;
      if (step % 2 === 0) tone(SCALE[Math.floor(Math.random() * SCALE.length)], 0, 0.5, 'sine', 0.035);
      if (step % 8 === 0) tone(196, 0, 1.2, 'triangle', 0.03);
      if (step % 8 === 4) tone(262, 0, 1.2, 'triangle', 0.03);
      step++;
    }, 300);
  },
  stop() { clearInterval(musicTimer); musicTimer = null; },
};
