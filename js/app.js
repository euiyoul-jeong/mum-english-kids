'use strict';

const STORAGE_KEY = 'mumkids:state';
const pad2 = n => String(n).padStart(2, '0');
const $ = id => document.getElementById(id);

// ── 상태 ──
function sanitize(s) {
  const age = AGES[s.age] ? +s.age : DEFAULT_STATE.age;
  const cat = AGES[age].cats.includes(s.cat) ? s.cat : 'story';
  const vol = Math.min(VOL_COUNT, Math.max(1, Math.round(+s.vol) || 1));
  const width = Math.min(100, Math.max(40, Math.round((+s.width || 100) / 10) * 10));
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
  // 다시 그려도 키보드 포커스가 같은 그룹에 남도록
  const group = document.activeElement && document.activeElement.closest('[role="radiogroup"]');
  state = sanitize({ ...state, ...patch });
  render();
  persist();
  if (group && group.isConnected && !group.closest('[hidden]')) focusChecked(group);
}

function volTitle(age, cat, vol) {
  const a = AGES[age];
  return (a.overrides[cat] || a.titles)[vol - 1];
}

function buildUrl({ age, cat, vol }) {
  return `${CONTENT_BASE}/${cat}?age=${age}&content=${vol}`;
}

// ── 라디오 그룹 (나이·카테고리·Vol 목록 공용) ──
// items: [{ value, render(el) }], 화살표/Home/End로 이동, Enter/Space/클릭으로 선택
function renderRadioGroup(container, items, selected, onSelect, itemClass) {
  container.innerHTML = '';
  items.forEach(it => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = itemClass;
    el.setAttribute('role', 'radio');
    const checked = it.value === selected;
    el.setAttribute('aria-checked', String(checked));
    el.tabIndex = checked ? 0 : -1;
    el.dataset.value = it.value;
    it.render(el, checked);
    el.addEventListener('click', () => onSelect(it.value));
    container.append(el);
  });
}

function bindRadioKeys(container) {
  container.addEventListener('keydown', e => {
    const list = [...container.querySelectorAll('[role="radio"]')];
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = list[i + 1] || list[0];
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = list[i - 1] || list[list.length - 1];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    if (!next) return;
    e.preventDefault();
    list.forEach(el => { el.tabIndex = el === next ? 0 : -1; });
    next.focus();
  });
}

function focusChecked(container) {
  const el = container.querySelector('[aria-checked="true"]');
  if (el) { el.focus(); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}

// ── 화면 요소 ──
const ageGroup = $('age-group');
const catGroup = $('cat-group');
const volList = $('vol-list');
const sheetList = $('sheet-list');
const volSheet = $('vol-sheet');
const volCurrent = $('vol-current');
const prevBtn = $('prev-vol');
const nextBtn = $('next-vol');
const widthRange = $('width-range');
const sizeLabel = $('size-label');
const viewer = $('viewer');
const loader = $('loader');
const offlineOverlay = $('offline-overlay');
const toast = $('toast');
[ageGroup, catGroup, volList, sheetList].forEach(bindRadioKeys);

const isLandscape = () => matchMedia('(orientation: landscape)').matches;

// ── 콘텐츠 로딩 ──
let currentUrl = '';
let loaderTimer = 0;

function hideLoader() {
  clearTimeout(loaderTimer);
  loader.classList.add('done');
}

function loadContent(force) {
  const url = buildUrl(state);
  if (url === currentUrl && !force) return;
  currentUrl = url;
  loader.classList.remove('done');
  clearTimeout(loaderTimer);
  loaderTimer = setTimeout(hideLoader, 10000);
  // 프레임 이동이 앱 뒤로가기 기록에 쌓이지 않도록 replace 사용
  try {
    if (viewer.contentWindow && viewer.getAttribute('src')) viewer.contentWindow.location.replace(url);
    else viewer.src = url;
  } catch {
    viewer.src = url;
  }
}
viewer.addEventListener('load', hideLoader);

// ── 렌더링 ──
function renderVolItems(container, age, cat, vol, onPick) {
  renderRadioGroup(
    container,
    Array.from({ length: VOL_COUNT }, (_, i) => ({
      value: i + 1,
      render(el) {
        const num = document.createElement('span');
        num.className = 'vol-num';
        num.textContent = pad2(i + 1);
        const name = document.createElement('span');
        name.textContent = volTitle(age, cat, i + 1);
        el.append(num, name);
      },
    })),
    vol,
    onPick,
    'vol-item'
  );
}

function render() {
  const { age, cat, vol, width } = state;
  const c = CATEGORIES[cat];

  renderRadioGroup(ageGroup, Object.keys(AGES).map(a => ({
    value: +a,
    render(el) { el.textContent = `${a}세`; },
  })), age, v => setState({ age: v }), 'seg');

  renderRadioGroup(catGroup, AGES[age].cats.map(k => ({
    value: k,
    render(el, checked) {
      if (checked) el.classList.add(CATEGORIES[k].cls);
      const dot = document.createElement('span');
      dot.className = `dot ${CATEGORIES[k].cls}`;
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = CATEGORIES[k].label;
      el.append(dot, label);
    },
  })), cat, v => setState({ cat: v }), 'chip');

  const chip = catGroup.querySelector('[aria-checked="true"]');
  if (chip && !isLandscape()) chip.scrollIntoView({ block: 'nearest', inline: 'nearest' });

  renderVolItems(volList, age, cat, vol, v => setState({ vol: v }));
  if (!volSheet.hidden) renderVolItems(sheetList, age, cat, vol, pickFromSheet);

  $('vol-current-num').textContent = pad2(vol);
  $('vol-current-name').textContent = volTitle(age, cat, vol);
  volCurrent.setAttribute('aria-label', `Vol.${pad2(vol)} ${volTitle(age, cat, vol)} — 목록 열기`);
  prevBtn.disabled = vol <= 1;
  nextBtn.disabled = vol >= VOL_COUNT;

  viewer.style.width = width + '%';
  widthRange.value = width;
  sizeLabel.textContent = width + '%';

  document.title = `뮤엠영어 Kids · ${age}세 ${c.label} Vol.${pad2(vol)}`;
  loadContent();
}

// ── Vol 시트 (세로 화면) ──
function openSheet() {
  renderVolItems(sheetList, state.age, state.cat, state.vol, pickFromSheet);
  volSheet.hidden = false;
  volCurrent.setAttribute('aria-expanded', 'true');
  focusChecked(sheetList);
}

function closeSheet() {
  if (volSheet.hidden) return;
  volSheet.hidden = true;
  volCurrent.setAttribute('aria-expanded', 'false');
  volCurrent.focus();
}

function pickFromSheet(vol) {
  closeSheet();
  setState({ vol });
}

volCurrent.addEventListener('click', () => {
  if (isLandscape()) focusChecked(volList);
  else openSheet();
});
$('sheet-close').addEventListener('click', closeSheet);
volSheet.addEventListener('click', e => { if (e.target === volSheet) closeSheet(); });

// ── 이전/다음 Vol, 화면 너비 ──
prevBtn.addEventListener('click', () => setState({ vol: state.vol - 1 }));
nextBtn.addEventListener('click', () => setState({ vol: state.vol + 1 }));
widthRange.addEventListener('input', () => setState({ width: widthRange.value }));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!volSheet.hidden) closeSheet();
    else if (!iosModal.hidden) closeIosModal();
    return;
  }
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (!volSheet.hidden || (e.target.closest && e.target.closest('[role="radiogroup"], input'))) return;
  if (e.key === 'ArrowLeft' && state.vol > 1) setState({ vol: state.vol - 1 });
  else if (e.key === 'ArrowRight' && state.vol < VOL_COUNT) setState({ vol: state.vol + 1 });
});

window.addEventListener('hashchange', () => {
  const h = readHash();
  if (h) setState(h);
});

// ── 링크 공유 ──
let toastTimer = 0;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

$('share-btn').addEventListener('click', async () => {
  const url = location.href;
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url }); } catch {}
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('링크를 복사했어요');
  } catch {
    showToast('복사하지 못했어요. 주소창의 링크를 이용해 주세요');
  }
});

// ── 오프라인 안내 ──
window.addEventListener('online', () => {
  offlineOverlay.hidden = true;
  loadContent(true);
});
window.addEventListener('offline', () => { offlineOverlay.hidden = false; });

// ── 앱 설치 ──
const installBtn = $('install-btn');
const iosModal = $('ios-modal');
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
  showToast('앱을 설치했어요');
});

if (isIOS && !isStandalone()) installBtn.hidden = false;

function closeIosModal() {
  iosModal.hidden = true;
  installBtn.focus();
}

installBtn.addEventListener('click', async () => {
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installBtn.hidden = true;
  } else if (isIOS) {
    iosModal.hidden = false;
    $('ios-modal-close').focus();
  }
});

$('ios-modal-close').addEventListener('click', closeIosModal);
iosModal.addEventListener('click', e => { if (e.target === iosModal) closeIosModal(); });

// ── 시작 ──
render();
persist();
if (!navigator.onLine) offlineOverlay.hidden = false;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW 등록 실패', err));
  });
}
