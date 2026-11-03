// عالم المغامرات – الحفظ ف الجهاز (localStorage)
const KEY = 'aventure_kids_v1';
const DEF = {
  lang: null, hero: 'rayan', voice: true, music: true, sfx: true,
  timeLimit: 0, playedDate: '', playedMin: 0,
  stars: 0, medals: [], hats: ['none', 'cap'], hat: 'none',
  shirt: { rayan: '#e5533d', salma: '#8e5bd6' }, hair: { rayan: '#3b2414', salma: '#5a3220' },
  island: { keys: [], starsPicked: [], zoneStars: {}, done: false, intro: false },
  worlds: {},
};
const WDEF = { keys: [], starsPicked: [], zoneStars: {}, done: false, intro: false };
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (j) return Object.assign(structuredClone(DEF), j, { island: Object.assign(structuredClone(DEF.island), j.island || {}), worlds: j.worlds || {} });
  } catch (e) {}
  return structuredClone(DEF);
}
export const S = load();
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function resetAll() { localStorage.removeItem(KEY); location.reload(); }
export function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
// الحالة ديال كل عالم (الجزيرة بقات ف S.island باش التقدم القديم ما يضيعش)
export function worldState(id) {
  if (id === 'island') return S.island;
  if (!S.worlds[id]) S.worlds[id] = structuredClone(WDEF);
  return S.worlds[id];
}
