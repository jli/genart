// DiceBear Fun Emoji renderer — expressive emoji faces, no skin/hair
// https://www.dicebear.com/styles/fun-emoji/
import { STYLES, BODY, SKULL, BG_OPTS, makeRenderer } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { funEmoji }     = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

const EYES_OPTS = [
  { id:'cute',       name:'cute' },
  { id:'love',       name:'in love <3' },
  { id:'stars',      name:'stars ★★' },
  { id:'wink',       name:'wink ;)' },
  { id:'wink2',      name:'wink 2' },
  { id:'plain',      name:'plain' },
  { id:'closed',     name:'closed -_-' },
  { id:'closed2',    name:'closed 2' },
  { id:'sleepClose', name:'sleepy' },
  { id:'glasses',    name:'glasses' },
  { id:'shades',     name:'shades 😎' },
  { id:'sad',        name:'sad ;_;' },
  { id:'tearDrop',   name:'tear drop' },
  { id:'crying',     name:'crying' },
  { id:'pissed',     name:'pissed' },
];

const MOUTH_OPTS = [
  { id:'cute',       name:'cute uwu' },
  { id:'kissHeart',  name:'kiss heart 💋' },
  { id:'lilSmile',   name:'lil smile' },
  { id:'wideSmile',  name:'wide smile' },
  { id:'smileTeeth', name:'teeth smile' },
  { id:'smileLol',   name:'lol' },
  { id:'tongueOut',  name:'tongue out' },
  { id:'shout',      name:'shout' },
  { id:'shy',        name:'shy' },
  { id:'plain',      name:'plain' },
  { id:'drip',       name:'drip' },
  { id:'sad',        name:'sad' },
  { id:'pissed',     name:'pissed' },
  { id:'sick',       name:'sick' },
  { id:'faceMask',   name:'mask' },
];

export const PARTS = {
  eyes:       EYES_OPTS,
  mouth:      MOUTH_OPTS,
  background: BG_OPTS,
};

export const CATEGORY_ORDER = ['eyes','mouth','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: {
    eyes:       'cute',
    mouth:      'cute',
    background: 'yellow',
  },
};

const R = makeRenderer({
  createAvatar, style: funEmoji,
  PARTS, CATEGORY_ORDER, DEFAULT_AVATAR,
  hasSkin: false,
  catKey: {
    eyes:  'eyes',
    mouth: 'mouth',
  },
});

export const { SKIN_TONES, ASPECT_RATIO, renderAvatarFull, renderPartPreview } = R;
export { STYLES, BODY, SKULL };
