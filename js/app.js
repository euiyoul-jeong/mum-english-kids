'use strict';

const STORAGE_KEY = 'mumkids:state';
const pad2 = n => String(n).padStart(2, '0');

// ── 상태 ──
function sanitize(s) {
  const age = AGES[s.age] ? +s.age : DEFAULT_STATE.age;
  const cat = AGES[age].cats.includes(s.cat) ? s.cat : 'story';
  const vol = Math.min(VOL_COUNT, Math.max(1, Math.round(+s.vol) || 1));
  const width = Math.min(100, Math.max(20, Math.round((+s.width || 100) / 10) * 10));
  return { age, cat, vol, width };
}

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (!p.has('age') && !p.has('cat') && !p.has('vol')) return null;
  return { age: p.get('age'), cat: p.get('cat'), vol: p.get('vol') };
}

function readStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  const hash = `#age=${state.age}&cat=${state.cat}&vol=${state.vol}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

let state = sanitize({ ...DEFAULT_STATE, ...readStorage(), ...readHash() });

function setState(patch) {
  state = sanitize({ ...state, ...patch });
  render();
  persist();
}

function volTitle(age, cat, vol) {
  const a = AGES[age];
  return (a.overrides[cat] || a.titles)[vol - 1];
}

function buildUrl({ age, cat, vol }) {
  return `${CONTENT_BASE}/${cat}?age=${age}&content=${vol}`;
}

// ── 드롭다운 (나이·카테고리·Vol 공용) ──
const dropdowns = [];

function closeAllDropdowns() { dropdowns.forEach(d => d.close()); }

function createDropdown(id, onSelect) {
  const root = document.getElementById(id);
  const btn = root.querySelector('.dropdown-btn');
  const panel = root.querySelector('.dropdown-panel');
  const display = root.querySelector('[data-display]');

  const items = () => [...panel.querySelectorAll('.panel-item')];
  const isOpen = () => panel.classList.contains('open');

  function open() {
    closeAllDropdowns();
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    const sel = panel.querySelector('[aria-selected="true"]') || items()[0];
    if (sel) { sel.focus(); sel.scrollIntoView({ block: 'nearest' }); }
  }

  function close(focusBtn) {
    if (!isOpen()) return;
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus();
  }

  btn.addEventListener('click', () => (isOpen() ? close() : open()));
  btn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
  });

  panel.addEventListener('keydown', e => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (list[i + 1] || list[0]).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (list[i - 1] || list[list.length - 1]).focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (list[i]) list[i].click(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close();
  });

  // entries: [{ value, label, cls? }]
  function setItems(entries, selected) {
    panel.innerHTML = '';
    entries.forEach(it => {
      const li = document.createElement('li');
      li.className = 'panel-item';
      li.setAttribute('role', 'option');
      li.tabIndex = -1;
      li.setAttribute('aria-selected', String(it.value === selected));
      if (it.cls) {
        const dot = document.createElement('span');
        dot.className = `panel-dot ${it.cls}`;
        li.append(dot);
      }
      li.append(it.label);
      li.addEventListener('click', () => { close(true); onSelect(it.value); });
      panel.append(li);
    });
  }

  function setDisplay(text, cls) {
    display.textContent = text;
    if (cls !== undefined) display.className = cls;
  }

  const dd = { root, setItems, setDisplay, close };
  dropdowns.push(dd);
  return dd;
}

document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown')) closeAllDropdowns();
});

// ── 화면 ──
const ageDD = createDropdown('age-dd', age => setState({ age }));
const catDD = createDropdown('cat-dd', cat => setState({ cat }));
const volDD = createDropdown('vol-dd', vol => setState({ vol }));
const viewer = document.getElementById('viewer');
const prevBtn = document.getElementById('prev-vol');
const nextBtn = document.getElementById('next-vol');
const sizeLabel = document.getElementById('size-label');
const offlineOverlay = document.getElementById('offline-overlay');
let currentUrl = '';

function loadContent(force) {
  const url = buildUrl(state);
  if (url === currentUrl && !force) return;
  currentUrl = url;
  // 프레임 이동이 앱 뒤로가기 기록에 쌓이지 않도록 replace 사용
  try {
    if (viewer.contentWindow && viewer.getAttribute('src')) viewer.contentWindow.location.replace(url);
    else viewer.src = url;
  } catch {
    viewer.src = url;
  }
}

function render() {
  const { age, cat, vol, width } = state;
  const ageInfo = AGES[age];

  ageDD.setDisplay(`${age}세`);
  ageDD.setItems(Object.keys(AGES).map(a => ({ value: +a, label: `${a}세` })), age);

  const c = CATEGORIES[cat];
  catDD.setDisplay(c.label, `cat-pill ${c.cls}`);
  catDD.setItems(ageInfo.cats.map(k => ({ value: k, label: CATEGORIES[k].label, cls: CATEGORIES[k].cls })), cat);

  const volLabel = n => `Vol.${pad2(n)}  ${volTitle(age, cat, n)}`;
  volDD.setDisplay(volLabel(vol));
  volDD.setItems(Array.from({ length: VOL_COUNT }, (_, i) => ({ value: i + 1, label: volLabel(i + 1) })), vol);

  prevBtn.disabled = vol <= 1;
  nextBtn.disabled = vol >= VOL_COUNT;

  viewer.style.width = width + '%';
  sizeLabel.textContent = width + '%';

  document.title = `뮤엠영어 Kids · ${age}세 ${c.label} Vol.${pad2(vol)}`;
  loadContent();
}

// ── 이전/다음 Vol, 폭 조절 ──
prevBtn.addEventListener('click', () => setState({ vol: state.vol - 1 }));
nextBtn.addEventListener('click', () => setState({ vol: state.vol + 1 }));
document.getElementById('width-down').addEventListener('click', () => setState({ width: state.width - 10 }));
document.getElementById('width-up').addEventListener('click', () => setState({ width: state.width + 10 }));

document.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest && e.target.closest('.dropdown-panel, input, textarea')) return;
  if (e.key === 'ArrowLeft' && state.vol > 1) setState({ vol: state.vol - 1 });
  else if (e.key === 'ArrowRight' && state.vol < VOL_COUNT) setState({ vol: state.vol + 1 });
});

window.addEventListener('hashchange', () => {
  const h = readHash();
  if (h) setState(h);
});

// ── 오프라인 안내 ──
function updateOnline() {
  const offline = !navigator.onLine;
  offlineOverlay.hidden = !offline;
  if (!offline) loadContent(true);
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', () => { offlineOverlay.hidden = false; });

// ── 앱 설치 ──
const installBtn = document.getElementById('install-btn');
const iosModal = document.getElementById('ios-modal');
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  installBtn.hidden = false;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installBtn.hidden = true;
});

if (isIOS && !isStandalone()) installBtn.hidden = false;

installBtn.addEventListener('click', async () => {
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installBtn.hidden = true;
  } else if (isIOS) {
    iosModal.hidden = false;
    document.getElementById('ios-modal-close').focus();
  }
});

document.getElementById('ios-modal-close').addEventListener('click', () => {
  iosModal.hidden = true;
  installBtn.focus();
});
iosModal.addEventListener('click', e => { if (e.target === iosModal) iosModal.hidden = true; });

// ── 시작 ──
render();
persist();
if (!navigator.onLine) offlineOverlay.hidden = false;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW 등록 실패', err));
  });
}
