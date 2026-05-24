const RENDERER_KEY = 'avatar-eve:renderer-v1';
const STORE_KEY    = 'avatar-eve:collection-v1';
const PENDING_KEY  = 'avatar-eve:pending-avatar';

const RENDERERS = [
  'adventurer','avataaars','bigEars','bigSmile','bottts',
  'croodles','dylan','funEmoji','lorelei','micah',
  'miniavs','notionists','openPeeps','personas','pixelArt','toonHead',
];
const RENDERER_FILES = {
  bigSmile:   './parts-big-smile.js',
  micah:      './parts-micah.js',
  avataaars:  './parts-avataaars.js',
  lorelei:    './parts-lorelei.js',
  funEmoji:   './parts-fun-emoji.js',
  notionists: './parts-notionists.js',
  pixelArt:   './parts-pixel-art.js',
  adventurer: './parts-adventurer.js',
  bigEars:    './parts-big-ears.js',
  croodles:   './parts-croodles.js',
  openPeeps:  './parts-open-peeps.js',
  bottts:     './parts-bottts.js',
  personas:   './parts-personas.js',
  toonHead:   './parts-toon-head.js',
  dylan:      './parts-dylan.js',
  miniavs:    './parts-miniavs.js',
};
const RENDERER_LABELS = {
  bigSmile:   'big smile',
  micah:      'micah',
  avataaars:  'avataaars',
  lorelei:    'lorelei',
  funEmoji:   'fun emoji',
  notionists: 'notionists',
  pixelArt:   'pixel art',
  adventurer: 'adventurer',
  bigEars:    'big ears',
  croodles:   'croodles',
  openPeeps:  'open peeps',
  bottts:     'bottts',
  personas:   'personas',
  toonHead:   'toon head',
  dylan:      'dylan',
  miniavs:    'miniavs',
};

const _saved = localStorage.getItem(RENDERER_KEY) || 'bigSmile';
const rendererName = RENDERER_FILES[_saved] ? _saved : 'bigSmile';

const currentMod = await import(RENDERER_FILES[rendererName]);
const {
  PARTS, SKIN_TONES, CATEGORY_ORDER, DEFAULT_AVATAR, STYLES,
  renderAvatarFull, renderPartPreview,
  ASPECT_RATIO = '1',
} = currentMod;

document.getElementById('avatar-canvas').style.aspectRatio = ASPECT_RATIO;

const rendererModules = { [rendererName]: currentMod };

async function loadRenderer(name) {
  if (!rendererModules[name]) {
    rendererModules[name] = await import(RENDERER_FILES[name]);
  }
  return rendererModules[name];
}

const state = {
  current:    null,
  collection: [],
  activeTab:  CATEGORY_ORDER.includes('hair') ? 'hair' : CATEGORY_ORDER[1] || 'hair',
};

// ─────── persistence ───────
function loadCollection() {
  try {
    let saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!saved) {
      // Migrate from old per-renderer keys
      saved = [];
      for (const r of RENDERERS) {
        const old = JSON.parse(localStorage.getItem(`avatar-eve:collection-v1:${r}`)) || [];
        for (const a of old) saved.push({ ...a, renderer: r });
      }
      if (saved.length) localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    }
    state.collection = saved || [];
  } catch { state.collection = []; }
}
function saveCollection() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state.collection));
}

// ─────── helpers ───────
function newAvatar() {
  return {
    id:       'a-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    name:     '',
    renderer: rendererName,
    skin:     DEFAULT_AVATAR.skin,
    parts:    { ...DEFAULT_AVATAR.parts },
    created:  Date.now(),
    modified: Date.now(),
  };
}

// ─────── randomization ───────
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomize(style) {
  if (SKIN_TONES.length) state.current.skin = randomChoice(SKIN_TONES).id;
  for (const cat of CATEGORY_ORDER) {
    if (cat === 'skin') continue;
    const all  = PARTS[cat] || [];
    if (!all.length) continue;
    const pool = style
      ? (all.filter(p => p.tags?.includes(style)).length ? all.filter(p => p.tags?.includes(style)) : all)
      : all;
    const chosen = randomChoice(pool).id;
    // accessories in geometric renderer is multi-select
    state.current.parts[cat] = cat === 'accessories'
      ? (chosen === 'none' ? [] : [chosen])
      : chosen;
  }
  state.current.modified = Date.now();
}

// ─────── ui rendering ───────
function renderCanvas() {
  document.getElementById('avatar-canvas').innerHTML = renderAvatarFull(state.current);
}

function renderCollection() {
  const list = document.getElementById('collection-list');
  if (!state.collection.length) {
    list.innerHTML = `<div class="collection-empty">no avatars yet —<br>customize one and hit save</div>`;
    return;
  }
  list.innerHTML = state.collection.map(a => {
    const r   = a.renderer || rendererName;
    const mod = rendererModules[r];
    const thumb = mod ? mod.renderAvatarFull(a) : '';
    const isCross = r !== rendererName;
    return `
      <div class="collection-item${state.current && state.current.id === a.id ? ' active' : ''}${isCross ? ' cross-renderer' : ''}" data-id="${a.id}">
        <div class="coll-thumb" id="ct-${a.id}">${thumb}</div>
        ${isCross ? `<div class="renderer-badge">${RENDERER_LABELS[r] || r}</div>` : ''}
        <div class="name">${escapeHtml(a.name || 'unnamed')}</div>
        <button class="delete" data-delete="${a.id}" title="delete">✕</button>
      </div>`;
  }).join('');

  // Lazily fill in thumbnails for not-yet-loaded renderers
  const needed = [...new Set(
    state.collection
      .map(a => a.renderer || rendererName)
      .filter(r => r !== rendererName && !rendererModules[r])
  )];
  for (const r of needed) {
    loadRenderer(r).then(mod => {
      for (const a of state.collection.filter(a => (a.renderer || rendererName) === r)) {
        const el = document.getElementById(`ct-${a.id}`);
        if (el) el.innerHTML = mod.renderAvatarFull(a);
      }
    });
  }
}

function renderTabs() {
  const bar = document.getElementById('tab-bar');
  bar.innerHTML = CATEGORY_ORDER.map(cat => `
    <button data-tab="${cat}" class="${state.activeTab === cat ? 'active' : ''}">${cat}</button>
  `).join('');
}

function renderPartGrid() {
  const grid = document.getElementById('part-grid');
  if (state.activeTab === 'skin') {
    grid.className = 'part-grid swatch-grid';
    grid.innerHTML = SKIN_TONES.map(s => `
      <div class="swatch${state.current.skin === s.id ? ' active' : ''}"
           style="background:${s.color}" data-skin="${s.id}" title="${s.id}"></div>
    `).join('');
    return;
  }
  // Any tab whose parts have _hex → render as color swatches
  const tabParts = PARTS[state.activeTab];
  if (tabParts && tabParts.length && tabParts[0]._hex !== undefined) {
    grid.className = 'part-grid swatch-grid';
    const cur = state.current.parts[state.activeTab];
    grid.innerHTML = tabParts.map(p => `
      <div class="swatch${cur === p.id ? ' active' : ''}"
           style="background:#${p._hex}" data-swatchtab="${state.activeTab}" data-swatchval="${p.id}" data-title="${p.name}"></div>
    `).join('');
    return;
  }
  grid.className = 'part-grid';
  const parts = PARTS[state.activeTab] || [];
  const activeIds = state.activeTab === 'accessories'
    ? (Array.isArray(state.current.parts.accessories) ? state.current.parts.accessories : [])
    : [state.current.parts[state.activeTab]];
  grid.innerHTML = parts.map(p => `
    <div class="part-option${activeIds.includes(p.id) ? ' active' : ''}" data-part="${p.id}" data-title="${p.name}">
      ${renderPartPreview(state.current, state.activeTab, p.id)}
    </div>
  `).join('');
  requestAnimationFrame(fixTileHeights);
}

// Update active classes in-place — avoids rebuilding the grid DOM (which
// would scroll mobile to top by destroying the tapped element).
function updatePartGridActive() {
  const grid = document.getElementById('part-grid');
  let activeIds;
  if (state.activeTab === 'accessories') {
    activeIds = Array.isArray(state.current.parts.accessories) ? state.current.parts.accessories : [];
  } else if (state.activeTab === 'skin') {
    activeIds = [state.current.skin];
  } else {
    activeIds = [state.current.parts[state.activeTab]];
  }
  // part-option tiles and color swatches both live in the same grid
  for (const el of grid.querySelectorAll('[data-part], [data-swatchtab], [data-skin]')) {
    const id = el.dataset.part ?? el.dataset.swatchval ?? el.dataset.skin;
    el.classList.toggle('active', activeIds.includes(id));
  }
}

// ─────── events ───────
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    state.activeTab = tabBtn.dataset.tab;
    renderTabs(); renderPartGrid();
    return;
  }
  const partBtn = e.target.closest('[data-part]');
  if (partBtn && state.activeTab !== 'skin') {
    if (state.activeTab === 'accessories') {
      const id = partBtn.dataset.part;
      if (id === 'none') {
        state.current.parts.accessories = [];
      } else {
        const arr = Array.isArray(state.current.parts.accessories) ? state.current.parts.accessories : [];
        const idx = arr.indexOf(id);
        state.current.parts.accessories = idx >= 0 ? arr.filter(x => x !== id) : [...arr, id];
      }
    } else {
      state.current.parts[state.activeTab] = partBtn.dataset.part;
    }
    state.current.modified = Date.now();
    renderCanvas(); updatePartGridActive();
    return;
  }
  const swatch = e.target.closest('[data-skin]');
  if (swatch) {
    state.current.skin = swatch.dataset.skin;
    state.current.modified = Date.now();
    renderCanvas(); updatePartGridActive();
    return;
  }
  const colorSwatch = e.target.closest('[data-swatchtab]');
  if (colorSwatch) {
    state.current.parts[colorSwatch.dataset.swatchtab] = colorSwatch.dataset.swatchval;
    state.current.modified = Date.now();
    renderCanvas(); updatePartGridActive();
    return;
  }
  const deleteBtn = e.target.closest('[data-delete]');
  if (deleteBtn) {
    e.stopPropagation();
    const id = deleteBtn.dataset.delete;
    state.collection = state.collection.filter(a => a.id !== id);
    saveCollection();
    if (state.current.id === id) { state.current = newAvatar(); updateAll(); }
    else renderCollection();
    return;
  }
  const collItem = e.target.closest('[data-id]');
  if (collItem) {
    const found = state.collection.find(a => a.id === collItem.dataset.id);
    if (found) {
      const avatarRenderer = found.renderer || rendererName;
      if (avatarRenderer !== rendererName) {
        localStorage.setItem(RENDERER_KEY, avatarRenderer);
        localStorage.setItem(PENDING_KEY, found.id);
        location.reload();
      } else {
        state.current = { ...found, parts: { ...found.parts } };
        updateAll();
      }
    }
  }
});

document.getElementById('btn-new').onclick = () => {
  state.current = newAvatar();
  updateAll();
};

document.getElementById('btn-save').onclick = () => {
  state.current.name     = document.getElementById('avatar-name').value.trim();
  state.current.renderer = rendererName;
  state.current.modified = Date.now();
  const idx = state.collection.findIndex(a => a.id === state.current.id);
  if (idx >= 0) state.collection[idx] = JSON.parse(JSON.stringify(state.current));
  else          state.collection.push(JSON.parse(JSON.stringify(state.current)));
  saveCollection();
  renderCollection();
  flash(document.getElementById('btn-save'));
};

document.getElementById('btn-random').onclick = () => {
  randomize(null);
  renderCanvas(); renderPartGrid();
};

document.getElementById('btn-renderer').textContent = `${RENDERER_LABELS[rendererName] || rendererName} ▾`;
document.getElementById('btn-renderer').onclick = openRendererModal;
document.getElementById('renderer-modal-close').onclick = closeRendererModal;
document.getElementById('renderer-modal').addEventListener('click', e => {
  if (e.target.classList.contains('renderer-modal-backdrop')) closeRendererModal();
});
document.getElementById('renderer-grid').addEventListener('click', e => {
  const card = e.target.closest('[data-renderer]');
  if (!card) return;
  const r = card.dataset.renderer;
  if (r === rendererName) { closeRendererModal(); return; }
  localStorage.setItem(RENDERER_KEY, r);
  location.reload();
});

document.getElementById('avatar-name').addEventListener('input', (e) => {
  state.current.name = e.target.value;
});

function fixTileHeights() {
  const grid = document.getElementById('part-grid');
  const tiles = grid.querySelectorAll('.part-option');
  if (!tiles.length) return;
  const w = tiles[0].getBoundingClientRect().width;
  if (!w) return;
  for (const t of tiles) t.style.height = w + 'px';
}

function flash(el) {
  const old = el.style.background;
  el.style.background = '#7cd47c';
  setTimeout(() => { el.style.background = old; }, 200);
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function updateAll() {
  document.getElementById('avatar-name').value = state.current.name || '';
  renderCanvas();
  renderTabs();
  renderPartGrid();
  renderCollection();
}

window.addEventListener('resize', () => requestAnimationFrame(fixTileHeights));

// ─────── renderer modal ───────
function openRendererModal() {
  const modal = document.getElementById('renderer-modal');
  const grid  = document.getElementById('renderer-grid');
  modal.hidden = false;
  grid.innerHTML = RENDERERS.map(r => `
    <div class="renderer-card${r === rendererName ? ' active' : ''}" data-renderer="${r}">
      <div class="renderer-preview" id="rp-${r}"></div>
      <div class="renderer-label">${RENDERER_LABELS[r] || r}</div>
    </div>
  `).join('');
  for (const r of RENDERERS) {
    loadRenderer(r).then(mod => {
      const el = document.getElementById(`rp-${r}`);
      if (el) el.innerHTML = mod.renderAvatarFull({ ...mod.DEFAULT_AVATAR, id: `preview-${r}` });
    });
  }
}

function closeRendererModal() {
  document.getElementById('renderer-modal').hidden = true;
}

// ─────── boot ───────
loadCollection();
const pendingId = localStorage.getItem(PENDING_KEY);
if (pendingId) {
  localStorage.removeItem(PENDING_KEY);
  const pending = state.collection.find(a => a.id === pendingId);
  state.current = pending ? { ...pending, parts: { ...pending.parts } } : newAvatar();
} else {
  state.current = newAvatar();
}
updateAll();
