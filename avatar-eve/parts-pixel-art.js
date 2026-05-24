// DiceBear Pixel Art — retro full-body characters with clothing
import { dicebearSvg, BG_OPTS, BG_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar, pixelArt } = await import('./vendor/dicebear.js');

const rng = (n, pfx) => Array.from({ length: n }, (_, i) => ({
  id: `${pfx}${String(i + 1).padStart(2, '0')}`, name: `${pfx} ${i + 1}`,
}));

export const SKIN_TONES = [
  { id:'s1', color:'#ffdbac' }, { id:'s2', color:'#f5cfa0' }, { id:'s3', color:'#eac393' },
  { id:'s4', color:'#e0b687' }, { id:'s5', color:'#cb9e6e' }, { id:'s6', color:'#b68655' },
  { id:'s7', color:'#a26d3d' }, { id:'s8', color:'#8d5524' },
];
const SKIN_HEX = { s1:'ffdbac', s2:'f5cfa0', s3:'eac393', s4:'e0b687', s5:'cb9e6e', s6:'b68655', s7:'a26d3d', s8:'8d5524' };

const HAIR_COLORS = [
  { id:'hc1', name:'ash',      _hex:'cab188' }, { id:'hc2', name:'bark',    _hex:'603a14' },
  { id:'hc3', name:'sand',     _hex:'83623b' }, { id:'hc4', name:'hazel',   _hex:'a78961' },
  { id:'hc5', name:'auburn',   _hex:'611c17' }, { id:'hc6', name:'copper',  _hex:'612616' },
  { id:'hc7', name:'espresso', _hex:'28150a' }, { id:'hc8', name:'teal',    _hex:'009bbd' },
  { id:'hc9', name:'crimson',  _hex:'bd1700' }, { id:'hc10',name:'lime',    _hex:'91cb15' },
];
const HAIR_HEX = Object.fromEntries(HAIR_COLORS.map(h => [h.id, h._hex]));

const CLOTHING_COLORS = [
  { id:'cc1', name:'sky',    _hex:'5bc0de' }, { id:'cc2', name:'blue',    _hex:'428bca' },
  { id:'cc3', name:'navy',   _hex:'03396c' }, { id:'cc4', name:'mint',    _hex:'88d8b0' },
  { id:'cc5', name:'green',  _hex:'44c585' }, { id:'cc6', name:'forest',  _hex:'00b159' },
  { id:'cc7', name:'salmon', _hex:'ff6f69' }, { id:'cc8', name:'red',     _hex:'d11141' },
  { id:'cc9', name:'maroon', _hex:'ae0001' }, { id:'cc10',name:'cream',   _hex:'ffeead' },
  { id:'cc11',name:'yellow', _hex:'ffd969' }, { id:'cc12',name:'gold',    _hex:'ffc425' },
];
const CLOTH_HEX = Object.fromEntries(CLOTHING_COLORS.map(c => [c.id, c._hex]));

const MOUTH = [
  ...Array.from({ length: 13 }, (_, i) => ({ id:`happy${String(i+1).padStart(2,'0')}`, name:`happy ${i+1}` })),
  ...Array.from({ length: 10 }, (_, i) => ({ id:`sad${String(i+1).padStart(2,'0')}`, name:`sad ${i+1}` })),
];

export const PARTS = {
  hair:          [...rng(24, 'short'), ...rng(21, 'long')],
  hairColor:     HAIR_COLORS,
  clothing:      rng(23, 'variant'),
  clothingColor: CLOTHING_COLORS,
  eyes:          rng(12, 'variant'),
  mouth:         MOUTH,
  glasses:       [{ id:'none', name:'none' }, ...rng(7, 'light'), ...rng(7, 'dark')],
  accessories:   [{ id:'none', name:'none' }, ...rng(4, 'variant')],
  background:    BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','clothing','clothingColor','eyes','mouth','glasses','accessories','background'];

export const DEFAULT_AVATAR = {
  skin: 's2',
  parts: { hair:'short05', hairColor:'hc2', clothing:'variant05', clothingColor:'cc1',
           eyes:'variant05', mouth:'happy03', glasses:'none', accessories:'none', background:'none' },
};

export { STYLES, BODY, SKULL, ASPECT_RATIO };

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed: av.id || 'default',
    skinColor:      [SKIN_HEX[av.skin] || 'f5cfa0'],
    hairColor:      [HAIR_HEX[p.hairColor] || '603a14'],
    clothingColor:  [CLOTH_HEX[p.clothingColor] || '5bc0de'],
    hair:           [p.hair || 'short05'],
    clothing:       [p.clothing || 'variant05'],
    eyes:           [p.eyes || 'variant05'],
    mouth:          [p.mouth || 'happy03'],
    glassesProbability:     p.glasses && p.glasses !== 'none' ? 100 : 0,
    ...(p.glasses && p.glasses !== 'none' ? { glasses: [p.glasses] } : {}),
    accessoriesProbability: p.accessories && p.accessories !== 'none' ? 100 : 0,
    ...(p.accessories && p.accessories !== 'none' ? { accessories: [p.accessories] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(pixelArt, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin') {
    opts.skinColor = [SKIN_HEX[partId] || 'f5cfa0'];
  } else if (cat === 'glasses') {
    opts.glassesProbability = partId === 'none' ? 0 : 100;
    if (partId !== 'none') opts.glasses = [partId]; else delete opts.glasses;
  } else if (cat === 'accessories') {
    opts.accessoriesProbability = partId === 'none' ? 0 : 100;
    if (partId !== 'none') opts.accessories = [partId]; else delete opts.accessories;
  } else if (['hair','clothing','eyes','mouth'].includes(cat)) {
    opts[cat] = [partId];
  }
  return dicebearSvg(createAvatar(pixelArt, opts).toString());
}
