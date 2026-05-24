// DiceBear Notionists renderer  (pure black-and-white figures, no skinColor support)
// Schema: https://api.dicebear.com/9.x/notionists/schema.json
//   hair: variant01-variant63, hat
//   body: variant01-variant25   eyes: variant01-variant05
//   brows: variant01-variant13  lips: variant01-variant30
//   nose: variant01-variant20   beard: variant01-variant12
//   glasses: variant01-variant11  gesture: 10 named values
//   bodyIcon: electric, saturn, galaxy

import { dicebearSvg } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { notionists } = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

// notionists figures are black/white — no skinColor support in the style
export const SKIN_TONES = []; // unused; skin tab hidden for this renderer

export const STYLES = ['default'];
export const ASPECT_RATIO = '1';

const range = (n) =>
  Array.from({ length: n }, (_, i) => {
    const id = `variant${String(i + 1).padStart(2, '0')}`;
    return { id, name: `style ${i + 1}` };
  });

const GESTURE_OPTS = [
  { id:'hand',              name:'hand' },
  { id:'point',             name:'point' },
  { id:'ok',                name:'ok' },
  { id:'waveLongArm',       name:'wave' },
  { id:'pointLongArm',      name:'point (long)' },
  { id:'okLongArm',         name:'ok (long)' },
  { id:'waveLongArms',      name:'wave both arms' },
  { id:'waveOkLongArms',    name:'wave + ok' },
  { id:'wavePointLongArms', name:'wave + point' },
  { id:'handPhone',         name:'phone' },
];

const BG_OPTS = [
  { id:'none',    name:'none',     colors:[],                  type:[] },
  { id:'cream',   name:'cream',    colors:['fdf6e3'],          type:['solid'] },
  { id:'pink',    name:'pink',     colors:['ffb3c6'],          type:['solid'] },
  { id:'purple',  name:'purple',   colors:['c9b8ff'],          type:['solid'] },
  { id:'sky',     name:'sky blue', colors:['b8d8ff'],          type:['solid'] },
  { id:'mint',    name:'mint',     colors:['b8f0e0'],          type:['solid'] },
  { id:'yellow',  name:'yellow',   colors:['fff3b8'],          type:['solid'] },
  { id:'peach',   name:'peach',    colors:['ffd5b0'],          type:['solid'] },
  { id:'sunset',  name:'sunset',   colors:['ffb347','ff6b6b'], type:['gradientLinear'] },
  { id:'ocean',   name:'ocean',    colors:['667eea','64b3f4'], type:['gradientLinear'] },
  { id:'rose',    name:'rose',     colors:['f953c6','b91d73'], type:['gradientLinear'] },
  { id:'forest',  name:'forest',   colors:['56ab2f','a8e063'], type:['gradientLinear'] },
];

export const PARTS = {
  hair:       [...range(63), { id:'hat', name:'hat' }],
  eyes:       range(5),
  brows:      range(13),
  mouth:      range(30),
  nose:       range(20),
  body:       range(25),
  beard:      [{ id:'none', name:'none' }, ...range(12)],
  glasses:    [{ id:'none', name:'none' }, ...range(11)],
  gesture:    [{ id:'none', name:'none' }, ...GESTURE_OPTS],
  bodyIcon:   [
    { id:'none',     name:'none' },
    { id:'electric', name:'electric ⚡' },
    { id:'saturn',   name:'saturn 🪐' },
    { id:'galaxy',   name:'galaxy ✨' },
  ],
  background: BG_OPTS,
};

// skin not included — notionists doesn't support it
export const CATEGORY_ORDER = ['hair','eyes','brows','mouth','nose','body','beard','glasses','gesture','bodyIcon','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair', // kept for schema compat, not used in rendering
  parts: {
    hair:       'variant05',
    eyes:       'variant01',
    brows:      'variant02',
    mouth:      'variant07',
    nose:       'variant03',
    body:       'variant01',
    beard:      'none',
    glasses:    'none',
    gesture:    'none',
    bodyIcon:   'none',
    background: 'none',
  },
};

// Maps our category names → DiceBear option keys
const CAT_KEY = {
  hair:'hair',    eyes:'eyes',    brows:'brows',
  mouth:'lips',   // our "mouth" → DiceBear "lips"
  nose:'nose',    body:'body',    beard:'beard',
  glasses:'glasses', gesture:'gesture', bodyIcon:'bodyIcon',
};

const BG_MAP = Object.fromEntries(BG_OPTS.map(b => [b.id, b]));

function _buildOpts(avatar) {
  const p = avatar.parts;
  const opts = {
    seed:                 avatar.id || 'default',
    glassesProbability:   0,
    beardProbability:     0,
    gestureProbability:   0,
    bodyIconProbability:  0,
  };
  for (const [cat, key] of Object.entries(CAT_KEY)) {
    const val = p[cat];
    if (val && val !== 'none') {
      opts[key] = [val];
      if (cat === 'glasses')  opts.glassesProbability  = 100;
      if (cat === 'beard')    opts.beardProbability    = 100;
      if (cat === 'gesture')  opts.gestureProbability  = 100;
      if (cat === 'bodyIcon') opts.bodyIconProbability = 100;
    }
  }
  const bg = BG_MAP[p.background];
  if (bg?.colors.length) {
    opts.backgroundColor = bg.colors;
    opts.backgroundType  = bg.type;
  }
  return opts;
}

export function renderAvatarFull(avatar) {
  return dicebearSvg(createAvatar(notionists, _buildOpts(avatar)).toString());
}

export function renderPartPreview(avatar, category, partId) {
  const opts = _buildOpts(avatar);

  if (category === 'background') {
    const bg = BG_MAP[partId];
    if (bg?.colors.length) { opts.backgroundColor = bg.colors; opts.backgroundType = bg.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else {
    const key = CAT_KEY[category];
    if (key) {
      if (partId === 'none') {
        delete opts[key];
        if (category === 'glasses')  opts.glassesProbability  = 0;
        if (category === 'beard')    opts.beardProbability    = 0;
        if (category === 'gesture')  opts.gestureProbability  = 0;
        if (category === 'bodyIcon') opts.bodyIconProbability = 0;
      } else {
        opts[key] = [partId];
        if (category === 'glasses')  opts.glassesProbability  = 100;
        if (category === 'beard')    opts.beardProbability    = 100;
        if (category === 'gesture')  opts.gestureProbability  = 100;
        if (category === 'bodyIcon') opts.bodyIconProbability = 100;
      }
    }
  }
  return dicebearSvg(createAvatar(notionists, opts).toString());
}

export const BODY  = () => '';
export const SKULL = () => '';
