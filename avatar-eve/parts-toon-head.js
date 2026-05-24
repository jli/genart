// DiceBear Toon Head — cartoon character with clothing options
import { dicebearSvg, BG_OPTS, BG_MAP, SKIN_TONES, SKIN_MAP, HAIR_COLOR_PARTS, HAIR_COLOR_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { toonHead } = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

export { SKIN_TONES, STYLES, BODY, SKULL, ASPECT_RATIO };

const CLOTHES_COLORS = [
  { id:'navy',   name:'navy',    _hex:'2c3e6b' }, { id:'red',    name:'red',     _hex:'c0392b' },
  { id:'green',  name:'green',   _hex:'27ae60' }, { id:'purple', name:'purple',  _hex:'8e44ad' },
  { id:'teal',   name:'teal',    _hex:'16a085' }, { id:'orange', name:'orange',  _hex:'d35400' },
  { id:'gray',   name:'gray',    _hex:'7f8c8d' }, { id:'black',  name:'black',   _hex:'2c3e50' },
  { id:'pink',   name:'pink',    _hex:'e91e8c' }, { id:'white',  name:'white',   _hex:'ecf0f1' },
];
const CLOTHES_HEX = Object.fromEntries(CLOTHES_COLORS.map(c => [c.id, c._hex]));

const BEARD_OPTS  = ['moustacheTwirl','fullBeard','chin','chinMoustache','longBeard']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));
const EYES_OPTS   = ['happy','wide','bow','humble','wink'].map(id => ({ id, name: id }));
const BROW_OPTS   = ['raised','angry','happy','sad','neutral'].map(id => ({ id, name: id }));
const MOUTH_OPTS  = ['laugh','angry','agape','smile','sad'].map(id => ({ id, name: id }));
const HAIR_OPTS   = ['sideComed','undercut','spiky','bun']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));
const REAR_OPTS   = ['longStraight','longWavy','shoulderHigh','neckHigh']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));
const CLOTHES_OPTS = ['turtleNeck','openJacket','dress','shirt','tShirt']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));

export const PARTS = {
  hair:        [{ id:'none', name:'none' }, ...HAIR_OPTS],
  hairColor:   HAIR_COLOR_PARTS,
  rearHair:    [{ id:'none', name:'none' }, ...REAR_OPTS],
  eyes:        EYES_OPTS,
  brows:       BROW_OPTS,
  mouth:       MOUTH_OPTS,
  beard:       [{ id:'none', name:'none' }, ...BEARD_OPTS],
  clothes:     CLOTHES_OPTS,
  clothesColor: CLOTHES_COLORS,
  background:  BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','rearHair','eyes','brows','mouth','beard','clothes','clothesColor','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { hair:'sideComed', hairColor:'darkbrown', rearHair:'none', eyes:'happy',
           brows:'neutral', mouth:'smile', beard:'none', clothes:'tShirt', clothesColor:'navy', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:               av.id || 'default',
    skinColor:          [SKIN_MAP[av.skin] || 'fcd0a8'],
    hairColor:          [HAIR_COLOR_MAP[p.hairColor] || '3a2418'],
    clothesColor:       [CLOTHES_HEX[p.clothesColor] || '2c3e6b'],
    clothes:            [p.clothes || 'tShirt'],
    eyes:               [p.eyes   || 'happy'],
    eyebrows:           [p.brows  || 'neutral'],
    mouth:              [p.mouth  || 'smile'],
    hairProbability:     p.hair     && p.hair     !== 'none' ? 100 : 0,
    rearHairProbability: p.rearHair && p.rearHair !== 'none' ? 100 : 0,
    beardProbability:    p.beard    && p.beard    !== 'none' ? 100 : 0,
    ...(p.hair     && p.hair     !== 'none' ? { hair:     [p.hair]     } : {}),
    ...(p.rearHair && p.rearHair !== 'none' ? { rearHair: [p.rearHair] } : {}),
    ...(p.beard    && p.beard    !== 'none' ? { beard:    [p.beard]    } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(toonHead, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin')    { opts.skinColor   = [SKIN_MAP[partId] || 'fcd0a8']; }
  else if (cat === 'eyes')      { opts.eyes        = [partId]; }
  else if (cat === 'brows')     { opts.eyebrows    = [partId]; }
  else if (cat === 'mouth')     { opts.mouth       = [partId]; }
  else if (cat === 'clothes')   { opts.clothes     = [partId]; }
  else if (cat === 'hair')    { opts.hairProbability     = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.hair     = [partId]; else delete opts.hair;     }
  else if (cat === 'rearHair'){ opts.rearHairProbability = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.rearHair = [partId]; else delete opts.rearHair; }
  else if (cat === 'beard')   { opts.beardProbability    = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.beard    = [partId]; else delete opts.beard;    }
  return dicebearSvg(createAvatar(toonHead, opts).toString());
}
