// DiceBear Miniavs — compact chibi-style characters
import { dicebearSvg, BG_OPTS, BG_MAP, SKIN_TONES, SKIN_MAP, HAIR_COLOR_PARTS, HAIR_COLOR_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { miniavs } = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

export { SKIN_TONES, STYLES, BODY, SKULL, ASPECT_RATIO };

const BODY_COLORS = [
  { id:'navy',   name:'navy',    _hex:'2c3e6b' }, { id:'red',    name:'red',    _hex:'c0392b' },
  { id:'green',  name:'green',   _hex:'27ae60' }, { id:'purple', name:'purple', _hex:'8e44ad' },
  { id:'teal',   name:'teal',    _hex:'16a085' }, { id:'orange', name:'orange', _hex:'d35400' },
  { id:'gray',   name:'gray',    _hex:'7f8c8d' }, { id:'black',  name:'black',  _hex:'2c3e50' },
  { id:'pink',   name:'pink',    _hex:'e91e8c' }, { id:'white',  name:'white',  _hex:'ecf0f1' },
];
const BODY_HEX = Object.fromEntries(BODY_COLORS.map(c => [c.id, c._hex]));

// schema says "balndess" — likely a typo for "baldness"
const HAIR_OPTS = ['balndess','slaughter','ponyTail','long','curly','stylish','elvis','classic02','classic01']
  .map(id => ({ id, name: id === 'balndess' ? 'bald' : id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));

const HEAD_OPTS   = ['normal','wide','thin'].map(id => ({ id, name: id }));
const EYES_OPTS   = ['normal','confident','happy'].map(id => ({ id, name: id }));
const MOUTH_OPTS  = ['default','missingTooth'].map(id => ({ id, name: id === 'default' ? 'normal' : 'missing tooth' }));
const BODY_OPTS   = ['tShirt','golf'].map(id => ({ id, name: id === 'tShirt' ? 't-shirt' : id }));
const MUST_OPTS   = ['pencilThinBeard','pencilThin','horshoe','freddy']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));

export const PARTS = {
  hair:      HAIR_OPTS,
  hairColor: HAIR_COLOR_PARTS,
  head:      HEAD_OPTS,
  eyes:      EYES_OPTS,
  mouth:     MOUTH_OPTS,
  body:      BODY_OPTS,
  bodyColor: BODY_COLORS,
  glasses:   [{ id:'none', name:'none' }, { id:'normal', name:'glasses' }],
  blushes:   [{ id:'none', name:'none' }, { id:'default', name:'blush' }],
  mustache:  [{ id:'none', name:'none' }, ...MUST_OPTS],
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','head','eyes','mouth','body','bodyColor','glasses','blushes','mustache','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { hair:'classic01', hairColor:'darkbrown', head:'normal', eyes:'happy',
           mouth:'default', body:'tShirt', bodyColor:'navy', glasses:'none', blushes:'none', mustache:'none', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:               av.id || 'default',
    skinColor:          [SKIN_MAP[av.skin] || 'fcd0a8'],
    hairColor:          [HAIR_COLOR_MAP[p.hairColor] || '3a2418'],
    bodyColor:          [BODY_HEX[p.bodyColor] || '2c3e6b'],
    hair:               [p.hair  || 'classic01'],
    head:               [p.head  || 'normal'],
    eyes:               [p.eyes  || 'happy'],
    mouth:              [p.mouth || 'default'],
    body:               [p.body  || 'tShirt'],
    glassesProbability:  p.glasses && p.glasses !== 'none' ? 100 : 0,
    blushesProbability:  p.blushes && p.blushes !== 'none' ? 100 : 0,
    mustacheProbability: p.mustache && p.mustache !== 'none' ? 100 : 0,
    ...(p.glasses && p.glasses !== 'none' ? { glasses:  [p.glasses]  } : {}),
    ...(p.blushes && p.blushes !== 'none' ? { blushes:  [p.blushes]  } : {}),
    ...(p.mustache&& p.mustache!== 'none' ? { mustache: [p.mustache] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(miniavs, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin')    { opts.skinColor = [SKIN_MAP[partId] || 'fcd0a8']; }
  else if (['hair','head','eyes','mouth','body'].includes(cat)) { opts[cat] = [partId]; }
  else if (cat === 'glasses')  { opts.glassesProbability  = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.glasses  = [partId]; else delete opts.glasses;  }
  else if (cat === 'blushes')  { opts.blushesProbability  = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.blushes  = [partId]; else delete opts.blushes;  }
  else if (cat === 'mustache') { opts.mustacheProbability = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.mustache = [partId]; else delete opts.mustache; }
  return dicebearSvg(createAvatar(miniavs, opts).toString());
}
