// DiceBear Croodles — hand-drawn doodle style, no skin color
import { dicebearSvg, BG_OPTS, BG_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { croodles } = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

export const SKIN_TONES = [];
export { STYLES, BODY, SKULL, ASPECT_RATIO };

const range = (n, pfx='variant') => Array.from({ length: n }, (_, i) => ({
  id: `${pfx}${String(i+1).padStart(2,'0')}`, name: `style ${i+1}`,
}));

const TOP_COLORS = [
  { id:'yellow',  name:'yellow',  _hex:'ffc700' },
  { id:'purple',  name:'purple',  _hex:'9747ff' },
  { id:'orange',  name:'orange',  _hex:'f24e1e' },
  { id:'blue',    name:'blue',    _hex:'699bf7' },
  { id:'green',   name:'green',   _hex:'0fa958' },
  { id:'black',   name:'black',   _hex:'000000' },
];
const TOP_HEX = Object.fromEntries(TOP_COLORS.map(c => [c.id, c._hex]));

export const PARTS = {
  top:        range(29),
  topColor:   TOP_COLORS,
  face:       range(8),
  eyes:       range(16),
  mouth:      range(18),
  nose:       range(9),
  beard:      [{ id:'none', name:'none' }, ...range(5)],
  mustache:   [{ id:'none', name:'none' }, ...range(4)],
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['top','topColor','face','eyes','mouth','nose','beard','mustache','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { top:'variant05', topColor:'yellow', face:'variant02', eyes:'variant04',
           mouth:'variant06', nose:'variant03', beard:'none', mustache:'none', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:              av.id || 'default',
    topColor:          [TOP_HEX[p.topColor] || 'ffc700'],
    top:               [p.top   || 'variant05'],
    face:              [p.face  || 'variant02'],
    eyes:              [p.eyes  || 'variant04'],
    mouth:             [p.mouth || 'variant06'],
    nose:              [p.nose  || 'variant03'],
    beardProbability:    p.beard    && p.beard    !== 'none' ? 100 : 0,
    mustacheProbability: p.mustache && p.mustache !== 'none' ? 100 : 0,
    ...(p.beard    && p.beard    !== 'none' ? { beard:    [p.beard]    } : {}),
    ...(p.mustache && p.mustache !== 'none' ? { mustache: [p.mustache] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(croodles, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'beard') {
    opts.beardProbability    = partId === 'none' ? 0 : 100;
    if (partId !== 'none') opts.beard    = [partId]; else delete opts.beard;
  } else if (cat === 'mustache') {
    opts.mustacheProbability = partId === 'none' ? 0 : 100;
    if (partId !== 'none') opts.mustache = [partId]; else delete opts.mustache;
  } else if (['top','face','eyes','mouth','nose'].includes(cat)) {
    opts[cat] = [partId];
  }
  return dicebearSvg(createAvatar(croodles, opts).toString());
}
