// DiceBear Micah renderer — clean illustrated style, full color support
// https://www.dicebear.com/styles/micah/
import { STYLES, BODY, SKULL, BG_OPTS, HAIR_COLOR_PARTS, makeRenderer } from './dicebear-shared.js';

const { createAvatar, micah } = await import('./vendor/dicebear.js');

const HAIR_OPTS = [
  { id:'fonze',       name:'fonze' },
  { id:'mrT',         name:'mr T' },
  { id:'dougFunny',   name:'doug funny' },
  { id:'mrClean',     name:'mr clean' },
  { id:'dannyPhantom',name:'danny phantom' },
  { id:'full',        name:'full' },
  { id:'turban',      name:'turban' },
  { id:'pixie',       name:'pixie' },
];

const EYES_OPTS = [
  { id:'eyes',          name:'default' },
  { id:'round',         name:'round' },
  { id:'eyesShadow',    name:'shadow' },
  { id:'smiling',       name:'smiling' },
  { id:'smilingShadow', name:'smiling shadow' },
];

const BROWS_OPTS = [
  { id:'up',           name:'up' },
  { id:'down',         name:'down' },
  { id:'eyelashesUp',  name:'lashes up' },
  { id:'eyelashesDown',name:'lashes down' },
];

const MOUTH_OPTS = [
  { id:'surprised', name:'surprised' },
  { id:'laughing',  name:'laughing' },
  { id:'nervous',   name:'nervous' },
  { id:'smile',     name:'smile' },
  { id:'sad',       name:'sad' },
  { id:'pucker',    name:'pucker' },
  { id:'frown',     name:'frown' },
  { id:'smirk',     name:'smirk' },
];

export const PARTS = {
  hair:      HAIR_OPTS,
  hairColor: HAIR_COLOR_PARTS,
  eyes:      EYES_OPTS,
  brows:     BROWS_OPTS,
  mouth:     MOUTH_OPTS,
  nose:      [{ id:'curve', name:'curve' }, { id:'pointed', name:'pointed' }, { id:'tound', name:'round' }],
  ears:      [{ id:'attached', name:'attached' }, { id:'detached', name:'detached' }],
  shirt:     [{ id:'open', name:'open collar' }, { id:'crew', name:'crew neck' }, { id:'collared', name:'collared' }],
  glasses:   [{ id:'none', name:'none' }, { id:'round', name:'round' }, { id:'square', name:'square' }],
  earrings:  [{ id:'none', name:'none' }, { id:'hoop', name:'hoop' }, { id:'stud', name:'stud' }],
  beard:     [{ id:'none', name:'none' }, { id:'beard', name:'beard' }, { id:'scruff', name:'scruff' }],
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','eyes','brows','mouth','nose','ears','shirt','glasses','earrings','beard','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: {
    hair:      'full',
    hairColor: 'darkbrown',
    eyes:      'eyes',
    brows:     'up',
    mouth:     'smile',
    nose:      'curve',
    ears:      'attached',
    shirt:     'crew',
    glasses:   'none',
    earrings:  'none',
    beard:     'none',
    background:'none',
  },
};

const R = makeRenderer({
  createAvatar, style: micah,
  PARTS, CATEGORY_ORDER, DEFAULT_AVATAR,
  skinKey: 'baseColor',   // micah uses baseColor, not skinColor
  hairColorKey: 'hairColor',
  catKey: {
    hair:     'hair',
    eyes:     'eyes',
    brows:    'eyebrows',
    mouth:    'mouth',
    nose:     'nose',
    ears:     'ears',
    shirt:    'shirt',
    glasses:  'glasses',
    earrings: 'earrings',
    beard:    'facialHair',
  },
  probCats: {
    glasses:  'glassesProbability',
    earrings: 'earringsProbability',
    beard:    'facialHairProbability',
  },
});

export const { SKIN_TONES, ASPECT_RATIO, renderAvatarFull, renderPartPreview } = R;
export { STYLES, BODY, SKULL };
