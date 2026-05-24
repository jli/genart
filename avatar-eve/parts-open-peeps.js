// DiceBear Open Peeps — illustrated characters by Pablo Stanley (CC0)
import { dicebearSvg, BG_OPTS, BG_MAP, SKIN_TONES, SKIN_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { openPeeps } = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

export { SKIN_TONES, STYLES, BODY, SKULL, ASPECT_RATIO };

const HEAD_OPTS = [
  'afro','bangs','bangs2','bantuKnots','bear','bun','bun2','buns',
  'cornrows','cornrows2','dreads1','dreads2','flatTop','flatTopLong',
  'grayBun','grayMedium','grayShort','hatBeanie','hatHip','hijab',
  'long','longAfro','longBangs','longCurly','medium1','medium2','medium3',
  'mediumBangs','mediumBangs2','mediumBangs3','mediumStraight',
  'mohawk','mohawk2','noHair1','noHair2','noHair3','pomp',
  'shaved1','shaved2','shaved3','short1','short2','short3','short4','short5',
  'turban','twists','twists2',
].map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').replace(/(\d+)/, ' $1').trim() }));

const FACE_OPTS = [
  'angryWithFang','awe','blank','calm','cheeky','concerned','concernedFear',
  'contempt','cute','cyclops','driven','eatingHappy','explaining','eyesClosed',
  'fear','hectic','lovingGrin1','lovingGrin2','monster','old','rage','serious',
  'smile','smileBig','smileLOL','smileTeethGap','solemn','suspicious','tired','veryAngry',
].map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').replace(/(\d+)/, ' $1').trim() }));

const FACIAL_HAIR_OPTS = [
  'chin','full','full2','full3','full4','goatee1','goatee2',
  'moustache1','moustache2','moustache3','moustache4','moustache5',
  'moustache6','moustache7','moustache8','moustache9',
].map(id => ({ id, name: id.replace(/(\d+)/, ' $1').trim() }));

const ACCESSORIES_OPTS = [
  'eyepatch','glasses','glasses2','glasses3','glasses4','glasses5','sunglasses','sunglasses2',
].map(id => ({ id, name: id.replace(/(\d+)/, ' $1').trim() }));

const HAIR_COLORS = [
  { id:'hc1', name:'raven',    _hex:'2c1b18' }, { id:'hc2', name:'white',    _hex:'e8e1e1' },
  { id:'hc3', name:'platinum', _hex:'ecdcbf' }, { id:'hc4', name:'blonde',   _hex:'d6b370' },
  { id:'hc5', name:'pink',     _hex:'f59797' }, { id:'hc6', name:'amber',    _hex:'b58143' },
  { id:'hc7', name:'caramel',  _hex:'a55728' }, { id:'hc8', name:'chestnut', _hex:'724133' },
  { id:'hc9', name:'espresso', _hex:'4a312c' }, { id:'hc10',name:'crimson',  _hex:'c93305' },
];
const HAIR_HEX = Object.fromEntries(HAIR_COLORS.map(h => [h.id, h._hex]));

const CLOTHING_COLORS = [
  { id:'cv1', name:'coral',  _hex:'e78276' }, { id:'cv2', name:'yellow', _hex:'ffcf77' },
  { id:'cv3', name:'lime',   _hex:'fdea6b' }, { id:'cv4', name:'mint',   _hex:'78e185' },
  { id:'cv5', name:'sky',    _hex:'9ddadb' }, { id:'cv6', name:'lavender',_hex:'8fa7df' },
  { id:'cv7', name:'pink',   _hex:'e279c7' },
];
const CLOTH_HEX = Object.fromEntries(CLOTHING_COLORS.map(c => [c.id, c._hex]));

export const PARTS = {
  head:          HEAD_OPTS,
  hairColor:     HAIR_COLORS,
  face:          FACE_OPTS,
  facialHair:    [{ id:'none', name:'none' }, ...FACIAL_HAIR_OPTS],
  accessories:   [{ id:'none', name:'none' }, ...ACCESSORIES_OPTS],
  clothingColor: CLOTHING_COLORS,
  background:    BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','head','hairColor','face','facialHair','accessories','clothingColor','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { head:'medium2', hairColor:'hc8', face:'smile', facialHair:'none',
           accessories:'none', clothingColor:'cv5', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:                    av.id || 'default',
    skinColor:               [SKIN_MAP[av.skin] || 'fcd0a8'],
    hairColor:               [HAIR_HEX[p.hairColor] || '4a312c'],
    clothingColor:           [CLOTH_HEX[p.clothingColor] || '9ddadb'],
    head:                    [p.head || 'medium2'],
    face:                    [p.face || 'smile'],
    facialHairProbability:   p.facialHair  && p.facialHair  !== 'none' ? 100 : 0,
    accessoriesProbability:  p.accessories && p.accessories !== 'none' ? 100 : 0,
    ...(p.facialHair  && p.facialHair  !== 'none' ? { facialHair:  [p.facialHair]  } : {}),
    ...(p.accessories && p.accessories !== 'none' ? { accessories: [p.accessories] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(openPeeps, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin') {
    opts.skinColor = [SKIN_MAP[partId] || 'fcd0a8'];
  } else if (cat === 'head')       { opts.head = [partId]; }
  else if (cat === 'face')         { opts.face = [partId]; }
  else if (cat === 'facialHair')   { opts.facialHairProbability  = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.facialHair  = [partId]; else delete opts.facialHair;  }
  else if (cat === 'accessories')  { opts.accessoriesProbability = partId === 'none' ? 0 : 100; if (partId !== 'none') opts.accessories = [partId]; else delete opts.accessories; }
  return dicebearSvg(createAvatar(openPeeps, opts).toString());
}
