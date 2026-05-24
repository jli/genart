// DiceBear Bottts — robot characters by Pablo Stanley
import { dicebearSvg, BG_OPTS, BG_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar, bottts } = await import('./vendor/dicebear.js');

export const SKIN_TONES = [];
export { STYLES, BODY, SKULL, ASPECT_RATIO };

const BODY_COLORS = [
  { id:'amber',   name:'amber',   _hex:'ffb300' }, { id:'blue',    name:'blue',    _hex:'1e88e5' },
  { id:'slate',   name:'slate',   _hex:'546e7a' }, { id:'brown',   name:'brown',   _hex:'6d4c41' },
  { id:'teal',    name:'teal',    _hex:'00acc1' }, { id:'orange',  name:'orange',  _hex:'f4511e' },
  { id:'purple',  name:'purple',  _hex:'5e35b1' }, { id:'green',   name:'green',   _hex:'43a047' },
  { id:'gray',    name:'gray',    _hex:'757575' }, { id:'indigo',  name:'indigo',  _hex:'3949ab' },
  { id:'pink',    name:'pink',    _hex:'e91e63' }, { id:'lime',    name:'lime',    _hex:'7cb342' },
  { id:'cyan',    name:'cyan',    _hex:'00bcd4' }, { id:'deep',    name:'deep red',_hex:'b71c1c' },
];
const COLOR_HEX = Object.fromEntries(BODY_COLORS.map(c => [c.id, c._hex]));

const EYES_OPTS = ['bulging','dizzy','eva','frame1','frame2','glow','happy','hearts',
  'robocop','round','roundFrame01','roundFrame02','sensor','shade01']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').replace(/(\d+)/, ' $1').trim() }));

const MOUTH_OPTS = ['bite','diagram','grill01','grill02','grill03','smile01','smile02','square01','square02']
  .map(id => ({ id, name: id.replace(/(\d+)/, ' $1').trim() }));

const FACE_OPTS = ['round01','round02','square01','square02','square03','square04']
  .map(id => ({ id, name: id.replace(/(\d+)/, ' $1').trim() }));

const SIDES_OPTS = ['antenna01','antenna02','cables01','cables02','round','square','squareAssymetric']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').replace(/(\d+)/, ' $1').trim() }));

const TOP_OPTS = ['antenna','antennaCrooked','bulb01','glowingBulb01','glowingBulb02','horns','lights','pyramid','radar']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').replace(/(\d+)/, ' $1').trim() }));

const TEXTURE_OPTS = ['camo01','camo02','circuits','dirty01','dirty02','dots','grunge01','grunge02']
  .map(id => ({ id, name: id.replace(/(\d+)/, ' $1').trim() }));

export const PARTS = {
  color:      BODY_COLORS,
  face:       FACE_OPTS,
  eyes:       EYES_OPTS,
  mouth:      MOUTH_OPTS,
  top:        [{ id:'none', name:'none' }, ...TOP_OPTS],
  sides:      [{ id:'none', name:'none' }, ...SIDES_OPTS],
  texture:    [{ id:'none', name:'none' }, ...TEXTURE_OPTS],
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['color','face','eyes','mouth','top','sides','texture','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { color:'blue', face:'round01', eyes:'happy', mouth:'smile01',
           top:'none', sides:'none', texture:'none', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:             av.id || 'default',
    colors:           [COLOR_HEX[p.color] || '1e88e5'],
    face:             [p.face  || 'round01'],
    eyes:             [p.eyes  || 'happy'],
    mouth:            [p.mouth || 'smile01'],
    topProbability:     p.top     && p.top     !== 'none' ? 100 : 0,
    sidesProbability:   p.sides   && p.sides   !== 'none' ? 100 : 0,
    textureProbability: p.texture && p.texture !== 'none' ? 100 : 0,
    ...(p.top     && p.top     !== 'none' ? { top:     [p.top]     } : {}),
    ...(p.sides   && p.sides   !== 'none' ? { sides:   [p.sides]   } : {}),
    ...(p.texture && p.texture !== 'none' ? { texture: [p.texture] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(bottts, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'face')    { opts.face  = [partId]; }
  else if (cat === 'eyes')      { opts.eyes  = [partId]; }
  else if (cat === 'mouth')     { opts.mouth = [partId]; }
  else if (cat === 'top')     { opts.topProbability     = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.top     = [partId]; else delete opts.top;     }
  else if (cat === 'sides')   { opts.sidesProbability   = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.sides   = [partId]; else delete opts.sides;   }
  else if (cat === 'texture') { opts.textureProbability = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.texture = [partId]; else delete opts.texture; }
  return dicebearSvg(createAvatar(bottts, opts).toString());
}
