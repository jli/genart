// DiceBear Personas — professional illustrated characters with full body + clothing
import { dicebearSvg, BG_OPTS, BG_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar, personas } = await import('./vendor/dicebear.js');

export { STYLES, BODY, SKULL, ASPECT_RATIO };

const HAIR_OPTS = [
  'long','sideShave','shortCombover','curlyHighTop','bobCut','curly','pigtails','curlyBun',
  'buzzcut','bobBangs','bald','balding','cap','bunUndercut','fade','beanie',
  'straightBun','extraLong','shortComboverChops','mohawk',
].map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));

const HAIR_COLORS = [
  { id:'plum',    name:'plum',   _hex:'362c47' }, { id:'mauve',   name:'mauve',  _hex:'6c4545' },
  { id:'rose',    name:'rose',   _hex:'e15c66' }, { id:'blush',   name:'blush',  _hex:'e16381' },
  { id:'peach',   name:'peach',  _hex:'f27d65' }, { id:'amber',   name:'amber',  _hex:'f29c65' },
  { id:'silver',  name:'silver', _hex:'dee1f5' },
];
const HAIR_HEX = Object.fromEntries(HAIR_COLORS.map(h => [h.id, h._hex]));

const CLOTHING_COLORS = [
  { id:'cv1', name:'blue',    _hex:'456dff' }, { id:'cv2', name:'teal',   _hex:'54d7c7' },
  { id:'cv3', name:'purple',  _hex:'7555ca' }, { id:'cv4', name:'green',  _hex:'6dbb58' },
  { id:'cv5', name:'red',     _hex:'e24553' }, { id:'cv6', name:'yellow', _hex:'f3b63a' },
  { id:'cv7', name:'pink',    _hex:'f55d81' },
];
const CLOTH_HEX = Object.fromEntries(CLOTHING_COLORS.map(c => [c.id, c._hex]));

const SKIN_PERSONAS = [
  { id:'sp1', color:'#eeb4a4' }, { id:'sp2', color:'#e7a391' }, { id:'sp3', color:'#e5a07e' },
  { id:'sp4', color:'#d78774' }, { id:'sp5', color:'#b16a5b' }, { id:'sp6', color:'#92594b' },
  { id:'sp7', color:'#623d36' },
];
const SKIN_P_HEX = Object.fromEntries(SKIN_PERSONAS.map(s => [s.id, s.color.slice(1)]));

export const SKIN_TONES = SKIN_PERSONAS;

const EYES_OPTS  = ['open','sleep','wink','glasses','happy','sunglasses'].map(id => ({ id, name: id }));
const MOUTH_OPTS = ['smile','frown','surprise','pacifier','bigSmile','smirk','lips'].map(id => ({ id, name: id }));
const FACIAL_HAIR = ['beardMustache','pyramid','walrus','goatee','shadow','soulPatch']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));
const NOSE_OPTS  = ['mediumRound','smallRound','wrinkles'].map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));
const BODY_OPTS  = ['squared','rounded','small','checkered'].map(id => ({ id, name: id }));

export const PARTS = {
  hair:          HAIR_OPTS,
  hairColor:     HAIR_COLORS,
  eyes:          EYES_OPTS,
  mouth:         MOUTH_OPTS,
  nose:          NOSE_OPTS,
  facialHair:    [{ id:'none', name:'none' }, ...FACIAL_HAIR],
  body:          BODY_OPTS,
  clothingColor: CLOTHING_COLORS,
  background:    BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','eyes','mouth','nose','facialHair','body','clothingColor','background'];

export const DEFAULT_AVATAR = {
  skin: 'sp2',
  parts: { hair:'bobCut', hairColor:'plum', eyes:'open', mouth:'smile', nose:'mediumRound',
           facialHair:'none', body:'rounded', clothingColor:'cv1', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:                   av.id || 'default',
    skinColor:              [SKIN_P_HEX[av.skin] || 'e7a391'],
    hairColor:              [HAIR_HEX[p.hairColor] || '362c47'],
    clothingColor:          [CLOTH_HEX[p.clothingColor] || '456dff'],
    hair:                   [p.hair || 'bobCut'],
    eyes:                   [p.eyes || 'open'],
    mouth:                  [p.mouth || 'smile'],
    nose:                   [p.nose || 'mediumRound'],
    body:                   [p.body || 'rounded'],
    facialHairProbability:  p.facialHair && p.facialHair !== 'none' ? 100 : 0,
    ...(p.facialHair && p.facialHair !== 'none' ? { facialHair: [p.facialHair] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(personas, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin') {
    opts.skinColor = [SKIN_P_HEX[partId] || 'e7a391'];
  } else if (cat === 'facialHair') {
    opts.facialHairProbability = partId === 'none' ? 0 : 100;
    if (partId !== 'none') opts.facialHair = [partId]; else delete opts.facialHair;
  } else if (['hair','eyes','mouth','nose','body'].includes(cat)) {
    opts[cat] = [partId];
  }
  return dicebearSvg(createAvatar(personas, opts).toString());
}
