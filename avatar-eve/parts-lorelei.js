// DiceBear Lorelei renderer — full color support (skinColor, hairColor, etc.)
// Schema: https://api.dicebear.com/9.x/lorelei/schema.json
//   hair: variant01-variant48      eyes: variant01-variant24
//   eyebrows: variant01-variant13  mouth: happy01-18, sad01-09
//   nose: variant01-variant06      head: variant01-variant04
//   beard: variant01-02            earrings: variant01-03
//   glasses: variant01-05          freckles: variant01
//   hairAccessories: flowers
//   skinColor, hairColor, eyeColor, etc. — all accept hex arrays

import { dicebearSvg } from './dicebear-shared.js';

const { createAvatar, lorelei } = await import('./vendor/dicebear.js');

const SKIN_MAP  = { pale:'ffe6d3', fair:'fcd0a8', olive:'e0a878', brown:'a16e4b', deep:'65422a' };
const HAIR_COLORS = [
  { id:'black',   name:'black',    hex:'1a1419' },
  { id:'dark',    name:'dark brown', hex:'3a2418' },
  { id:'brown',   name:'brown',    hex:'a86a3a' },
  { id:'auburn',  name:'auburn',   hex:'8b3a2a' },
  { id:'blonde',  name:'blonde',   hex:'d4a842' },
  { id:'platinum',name:'platinum', hex:'e8dcc8' },
  { id:'grey',    name:'grey',     hex:'9a9a9a' },
  { id:'white',   name:'white',    hex:'f5f0eb' },
  { id:'pink',    name:'pink',     hex:'e86b9a' },
  { id:'red',     name:'red',      hex:'cc2200' },
  { id:'purple',  name:'purple',   hex:'845ec2' },
  { id:'teal',    name:'teal',     hex:'2a9d8f' },
  { id:'blue',    name:'blue',     hex:'4472c4' },
  { id:'green',   name:'green',    hex:'4a8a3c' },
];

export const SKIN_TONES = [
  { id:'pale',  color:'#ffe6d3' },
  { id:'fair',  color:'#fcd0a8' },
  { id:'olive', color:'#e0a878' },
  { id:'brown', color:'#a16e4b' },
  { id:'deep',  color:'#65422a' },
];

export const STYLES = ['default'];
export const ASPECT_RATIO = '1';

const rangeN = (n, prefix='variant') =>
  Array.from({ length: n }, (_, i) => ({
    id:   `${prefix}${String(i + 1).padStart(2, '0')}`,
    name: `style ${i + 1}`,
  }));

const mouthOpts = [
  ...Array.from({ length: 18 }, (_, i) => ({
    id:   `happy${String(i + 1).padStart(2, '0')}`,
    name: `happy ${i + 1}`,
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id:   `sad${String(i + 1).padStart(2, '0')}`,
    name: `sad ${i + 1}`,
  })),
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

// Hair color "parts" — each "part" is a solid color swatch; rendered as styled preview
export const HAIR_COLOR_PARTS = HAIR_COLORS.map(h => ({
  id:   h.id,
  name: h.name,
  _hex: h.hex,
}));

export const PARTS = {
  hair:            rangeN(48),
  eyes:            rangeN(24),
  brows:           rangeN(13),
  mouth:           mouthOpts,
  nose:            rangeN(6),
  head:            rangeN(4),
  beard:           [{ id:'none', name:'none' }, ...rangeN(2)],
  earrings:        [{ id:'none', name:'none' }, ...rangeN(3)],
  glasses:         [{ id:'none', name:'none' }, ...rangeN(5)],
  freckles:        [{ id:'none', name:'none' }, { id:'variant01', name:'freckles' }],
  hairAccessories: [{ id:'none', name:'none' }, { id:'flowers', name:'flowers 🌸' }],
  hairColor:       HAIR_COLOR_PARTS,
  background:      BG_OPTS,
};

export const CATEGORY_ORDER = [
  'skin','hair','hairColor','eyes','brows','mouth','nose','head',
  'beard','earrings','glasses','freckles','hairAccessories','background',
];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: {
    hair:            'variant03',
    eyes:            'variant02',
    brows:           'variant04',
    mouth:           'happy03',
    nose:            'variant02',
    head:            'variant01',
    beard:           'none',
    earrings:        'none',
    glasses:         'none',
    freckles:        'none',
    hairAccessories: 'none',
    hairColor:       'dark',
    background:      'none',
  },
};

const BG_MAP = Object.fromEntries(BG_OPTS.map(b => [b.id, b]));
const HAIR_COLOR_MAP = Object.fromEntries(HAIR_COLORS.map(h => [h.id, h.hex]));

// Maps our category names → DiceBear option keys
const CAT_KEY = {
  hair:'hair', eyes:'eyes', brows:'eyebrows', // our 'brows' → DiceBear 'eyebrows'
  mouth:'mouth', nose:'nose', head:'head',
  beard:'beard', earrings:'earrings', glasses:'glasses',
  freckles:'freckles', hairAccessories:'hairAccessories',
};

function _buildOpts(avatar) {
  const skinHex  = SKIN_MAP[avatar.skin] || 'fcd0a8';
  const hairHex  = HAIR_COLOR_MAP[avatar.parts.hairColor] || '3a2418';
  const p        = avatar.parts;
  const opts = {
    seed:                      avatar.id || 'default',
    skinColor:                 [skinHex],
    hairColor:                 [hairHex],
    beardProbability:          0,
    earringsProbability:       0,
    glassesProbability:        0,
    frecklesProbability:       0,
    hairAccessoriesProbability: 0,
  };
  for (const [cat, key] of Object.entries(CAT_KEY)) {
    const val = p[cat];
    if (val && val !== 'none') {
      opts[key] = [val];
      if (cat === 'beard')           opts.beardProbability          = 100;
      if (cat === 'earrings')        opts.earringsProbability       = 100;
      if (cat === 'glasses')         opts.glassesProbability        = 100;
      if (cat === 'freckles')        opts.frecklesProbability       = 100;
      if (cat === 'hairAccessories') opts.hairAccessoriesProbability = 100;
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
  return dicebearSvg(createAvatar(lorelei, _buildOpts(avatar)).toString());
}

export function renderPartPreview(avatar, category, partId) {
  const opts = _buildOpts(avatar);

  if (category === 'background') {
    const bg = BG_MAP[partId];
    if (bg?.colors.length) { opts.backgroundColor = bg.colors; opts.backgroundType = bg.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (category === 'skin') {
    opts.skinColor = [SKIN_MAP[partId] || 'fcd0a8'];
  } else if (category === 'hairColor') {
    opts.hairColor = [HAIR_COLOR_MAP[partId] || '3a2418'];
  } else {
    const key = CAT_KEY[category];
    if (key) {
      if (partId === 'none') {
        delete opts[key];
        if (category === 'beard')           opts.beardProbability          = 0;
        if (category === 'earrings')        opts.earringsProbability       = 0;
        if (category === 'glasses')         opts.glassesProbability        = 0;
        if (category === 'freckles')        opts.frecklesProbability       = 0;
        if (category === 'hairAccessories') opts.hairAccessoriesProbability = 0;
      } else {
        opts[key] = [partId];
        if (category === 'beard')           opts.beardProbability          = 100;
        if (category === 'earrings')        opts.earringsProbability       = 100;
        if (category === 'glasses')         opts.glassesProbability        = 100;
        if (category === 'freckles')        opts.frecklesProbability       = 100;
        if (category === 'hairAccessories') opts.hairAccessoriesProbability = 100;
      }
    }
  }
  return dicebearSvg(createAvatar(lorelei, opts).toString());
}

export const BODY  = () => '';
export const SKULL = () => '';
