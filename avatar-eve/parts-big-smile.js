// DiceBear Big Smile renderer — cute illustrated characters with expressive faces
// https://www.dicebear.com/styles/big-smile/
import { STYLES, BODY, SKULL, BG_OPTS, HAIR_COLOR_PARTS, makeRenderer } from './dicebear-shared.js';

const { createAvatar } = await import('https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm');
const { bigSmile }     = await import('https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm');

const HAIR_OPTS = [
  { id:'shortHair',      name:'short' },
  { id:'curlyShortHair', name:'short curly' },
  { id:'straightHair',   name:'straight' },
  { id:'wavyBob',        name:'wavy bob' },
  { id:'curlyBob',       name:'curly bob' },
  { id:'bowlCutHair',    name:'bowl cut' },
  { id:'braids',         name:'braids' },
  { id:'bangs',          name:'bangs' },
  { id:'bunHair',        name:'bun' },
  { id:'froBun',         name:'fro bun' },
  { id:'mohawk',         name:'mohawk' },
  { id:'halfShavedHead', name:'half shaved' },
  { id:'shavedHead',     name:'shaved' },
];

const EYES_OPTS = [
  { id:'cheery',     name:'cheery' },
  { id:'normal',     name:'normal' },
  { id:'starstruck', name:'starstruck ★' },
  { id:'winking',    name:'winking ;)' },
  { id:'sleepy',     name:'sleepy' },
  { id:'confused',   name:'confused' },
  { id:'sad',        name:'sad' },
  { id:'angry',      name:'angry' },
];

const MOUTH_OPTS = [
  { id:'openedSmile',   name:'opened smile' },
  { id:'gapSmile',      name:'gap smile' },
  { id:'teethSmile',    name:'teeth smile' },
  { id:'kawaii',        name:'kawaii owo' },
  { id:'awkwardSmile',  name:'awkward' },
  { id:'braces',        name:'braces' },
  { id:'unimpressed',   name:'unimpressed' },
  { id:'openSad',       name:'sad open' },
];

const ACCESSORIES_OPTS = [
  { id:'none',          name:'none' },
  { id:'catEars',       name:'cat ears' },
  { id:'glasses',       name:'glasses' },
  { id:'sunglasses',    name:'sunglasses' },
  { id:'sailormoonCrown',name:'sailor crown' },
  { id:'clownNose',     name:'clown nose' },
  { id:'sleepMask',     name:'sleep mask' },
  { id:'faceMask',      name:'face mask' },
  { id:'mustache',      name:'mustache' },
];

export const PARTS = {
  hair:        HAIR_OPTS,
  hairColor:   HAIR_COLOR_PARTS,
  eyes:        EYES_OPTS,
  mouth:       MOUTH_OPTS,
  accessories: ACCESSORIES_OPTS,
  background:  BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','eyes','mouth','accessories','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: {
    hair:        'wavyBob',
    hairColor:   'darkbrown',
    eyes:        'cheery',
    mouth:       'openedSmile',
    accessories: 'none',
    background:  'none',
  },
};

const R = makeRenderer({
  createAvatar, style: bigSmile,
  PARTS, CATEGORY_ORDER, DEFAULT_AVATAR,
  hairColorKey: 'hairColor',
  catKey: {
    hair:        'hair',
    eyes:        'eyes',
    mouth:       'mouth',
    accessories: 'accessories',
  },
  probCats: {
    accessories: 'accessoriesProbability',
  },
});

export const { SKIN_TONES, ASPECT_RATIO, renderAvatarFull, renderPartPreview } = R;
export { STYLES, BODY, SKULL };
