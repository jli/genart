// DiceBear Adventurer — illustrated fantasy/cute style, rich hair + face options
import { dicebearSvg, BG_OPTS, BG_MAP, SKIN_TONES, SKIN_MAP, HAIR_COLOR_PARTS, HAIR_COLOR_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar, adventurer } = await import('./vendor/dicebear.js');

export { SKIN_TONES, STYLES, BODY, SKULL, ASPECT_RATIO };

const HAIR = [
  ...Array.from({ length: 19 }, (_, i) => ({ id:`short${String(i+1).padStart(2,'0')}`, name:`short ${i+1}` })),
  ...Array.from({ length: 26 }, (_, i) => ({ id:`long${String(i+1).padStart(2,'0')}`, name:`long ${i+1}` })),
];

const range = (n, pfx='variant') => Array.from({ length: n }, (_, i) => ({
  id: `${pfx}${String(i+1).padStart(2,'0')}`, name: `style ${i+1}`,
}));

const FEATURES = [
  { id:'none',       name:'none' },
  { id:'mustache',   name:'mustache' },
  { id:'blush',      name:'blush' },
  { id:'birthmark',  name:'birthmark' },
  { id:'freckles',   name:'freckles' },
];

export const PARTS = {
  hair:       HAIR,
  hairColor:  HAIR_COLOR_PARTS,
  eyes:       range(26),
  brows:      range(15),
  mouth:      range(30),
  glasses:    [{ id:'none', name:'none' }, ...range(5)],
  earrings:   [{ id:'none', name:'none' }, ...range(6)],
  features:   FEATURES,
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','eyes','brows','mouth','glasses','earrings','features','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { hair:'long05', hairColor:'darkbrown', eyes:'variant02', brows:'variant04',
           mouth:'variant15', glasses:'none', earrings:'none', features:'none', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:                  av.id || 'default',
    skinColor:             [SKIN_MAP[av.skin] || 'fcd0a8'],
    hairColor:             [HAIR_COLOR_MAP[p.hairColor] || '3a2418'],
    hair:                  [p.hair || 'long05'],
    eyebrows:              [p.brows || 'variant04'],
    eyes:                  [p.eyes || 'variant02'],
    mouth:                 [p.mouth || 'variant15'],
    glassesProbability:    p.glasses  && p.glasses  !== 'none' ? 100 : 0,
    earringsProbability:   p.earrings && p.earrings !== 'none' ? 100 : 0,
    featuresProbability:   p.features && p.features !== 'none' ? 100 : 0,
    ...(p.glasses  && p.glasses  !== 'none' ? { glasses:  [p.glasses]  } : {}),
    ...(p.earrings && p.earrings !== 'none' ? { earrings: [p.earrings] } : {}),
    ...(p.features && p.features !== 'none' ? { features: [p.features] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(adventurer, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin') {
    opts.skinColor = [SKIN_MAP[partId] || 'fcd0a8'];
  } else if (cat === 'hair')    { opts.hair      = [partId]; }
  else if (cat === 'brows')     { opts.eyebrows  = [partId]; }
  else if (cat === 'eyes')      { opts.eyes      = [partId]; }
  else if (cat === 'mouth')     { opts.mouth     = [partId]; }
  else if (cat === 'glasses')   { opts.glassesProbability  = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.glasses  = [partId]; else delete opts.glasses;  }
  else if (cat === 'earrings')  { opts.earringsProbability = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.earrings = [partId]; else delete opts.earrings; }
  else if (cat === 'features')  { opts.featuresProbability = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.features = [partId]; else delete opts.features; }
  return dicebearSvg(createAvatar(adventurer, opts).toString());
}
