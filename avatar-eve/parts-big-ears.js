// DiceBear Big Ears — expressive illustrated faces with prominent ear feature
import { dicebearSvg, BG_OPTS, BG_MAP, SKIN_TONES, SKIN_MAP, HAIR_COLOR_PARTS, HAIR_COLOR_MAP, STYLES, BODY, SKULL, ASPECT_RATIO } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { bigEars } = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

export { SKIN_TONES, STYLES, BODY, SKULL, ASPECT_RATIO };

const range = (n, pfx='variant') => Array.from({ length: n }, (_, i) => ({
  id: `${pfx}${String(i+1).padStart(2,'0')}`, name: `style ${i+1}`,
}));

export const PARTS = {
  hair:       [...range(20, 'long'), ...range(20, 'short')],
  hairColor:  HAIR_COLOR_PARTS,
  face:       range(10),
  eyes:       range(32),
  mouth:      range(40),
  nose:       range(12),
  ears:       range(8),
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','face','eyes','mouth','nose','ears','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: { hair:'long03', hairColor:'darkbrown', face:'variant02', eyes:'variant05',
           mouth:'variant10', nose:'variant04', ears:'variant03', background:'none' },
};

function _bg(id) { const b = BG_MAP[id]; return b?.colors.length ? { backgroundColor:b.colors, backgroundType:b.type } : {}; }

function _buildOpts(av) {
  const p = av.parts;
  return {
    seed:      av.id || 'default',
    skinColor: [SKIN_MAP[av.skin] || 'fcd0a8'],
    hairColor: [HAIR_COLOR_MAP[p.hairColor] || '3a2418'],
    hair:      [p.hair  || 'long03'],
    face:      [p.face  || 'variant02'],
    eyes:      [p.eyes  || 'variant05'],
    mouth:     [p.mouth || 'variant10'],
    nose:      [p.nose  || 'variant04'],
    ears:      [p.ears  || 'variant03'],
    ..._bg(p.background),
  };
}

export function renderAvatarFull(av) {
  return dicebearSvg(createAvatar(bigEars, _buildOpts(av)).toString());
}

export function renderPartPreview(av, cat, partId) {
  const opts = _buildOpts(av);
  if (cat === 'background') {
    const b = BG_MAP[partId];
    if (b?.colors.length) { opts.backgroundColor = b.colors; opts.backgroundType = b.type; }
    else { delete opts.backgroundColor; delete opts.backgroundType; }
  } else if (cat === 'skin') {
    opts.skinColor = [SKIN_MAP[partId] || 'fcd0a8'];
  } else if (['hair','face','eyes','mouth','nose','ears'].includes(cat)) {
    opts[cat] = [partId];
  }
  return dicebearSvg(createAvatar(bigEars, opts).toString());
}
