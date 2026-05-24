// DiceBear Dylan — illustrated characters with distinct mood expressions
import { dicebearSvg, BG_OPTS, BG_MAP, SKIN_TONES, SKIN_MAP, HAIR_COLOR_PARTS, HAIR_COLOR_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { dylan } = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

export { SKIN_TONES, STYLES, BODY, SKULL, ASPECT_RATIO };

const MOOD_OPTS = ['happy','superHappy','hopeful','neutral','confused','sad','angry']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));

const HAIR_OPTS = ['plain','wavy','shortCurls','parting','spiky','roundBob','longCurls','buns','bangs','fluffy','flatTop','shaggy']
  .map(id => ({ id, name: id.replace(/([A-Z])/g, ' $1').trim().toLowerCase() }));

export const PARTS = {
  hair:       HAIR_OPTS,
  hairColor:  HAIR_COLOR_PARTS,
  mood:       MOOD_OPTS,
  facialHair: [{ id:'none', name:'none' }, { id:'default', name:'beard' }],
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','mood','facialHair','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { hair:'wavy', hairColor:'darkbrown', mood:'happy', facialHair:'none', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:                 av.id || 'default',
    skinColor:            [SKIN_MAP[av.skin] || 'fcd0a8'],
    hairColor:            [HAIR_COLOR_MAP[p.hairColor] || '3a2418'],
    hair:                 [p.hair || 'wavy'],
    mood:                 [p.mood || 'happy'],
    facialHairProbability: p.facialHair && p.facialHair !== 'none' ? 100 : 0,
    ...(p.facialHair && p.facialHair !== 'none' ? { facialHair: [p.facialHair] } : {}),
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(dylan, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin')       { opts.skinColor = [SKIN_MAP[partId] || 'fcd0a8']; }
  else if (cat === 'hair')         { opts.hair = [partId]; }
  else if (cat === 'mood')         { opts.mood = [partId]; }
  else if (cat === 'facialHair')   {
    opts.facialHairProbability = partId === 'none' ? 0 : 100;
    if (partId !== 'none') opts.facialHair = [partId]; else delete opts.facialHair;
  }
  return dicebearSvg(createAvatar(dylan, opts).toString());
}
