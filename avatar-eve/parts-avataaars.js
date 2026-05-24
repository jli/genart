// DiceBear Avataaars renderer — the classic expressive cartoon avatar
// https://www.dicebear.com/styles/avataaars/
import { STYLES, BODY, SKULL, BG_OPTS, HAIR_COLOR_PARTS, makeRenderer } from './dicebear-shared.js';

const { createAvatar, avataaars } = await import('./vendor/dicebear.js');

const HAIR_OPTS = [
  { id:'bigHair',              name:'big hair' },
  { id:'bob',                  name:'bob' },
  { id:'bun',                  name:'bun' },
  { id:'curly',                name:'curly' },
  { id:'curvy',                name:'curvy' },
  { id:'dreads',               name:'dreads' },
  { id:'dreads01',             name:'dreads 1' },
  { id:'dreads02',             name:'dreads 2' },
  { id:'frida',                name:'frida' },
  { id:'fro',                  name:'fro' },
  { id:'froBand',              name:'fro band' },
  { id:'frizzle',              name:'frizzle' },
  { id:'longButNotTooLong',    name:'long' },
  { id:'miaWallace',           name:'mia wallace' },
  { id:'shaggy',               name:'shaggy' },
  { id:'shaggyMullet',         name:'shaggy mullet' },
  { id:'shavedSides',          name:'shaved sides' },
  { id:'shortCurly',           name:'short curly' },
  { id:'shortFlat',            name:'short flat' },
  { id:'shortRound',           name:'short round' },
  { id:'shortWaved',           name:'short waved' },
  { id:'sides',                name:'sides' },
  { id:'straight01',           name:'straight 1' },
  { id:'straight02',           name:'straight 2' },
  { id:'straightAndStrand',    name:'straight + strand' },
  { id:'theCaesar',            name:'the caesar' },
  { id:'theCaesarAndSidePart', name:'caesar + side part' },
  { id:'hat',                  name:'hat' },
  { id:'hijab',                name:'hijab' },
  { id:'turban',               name:'turban' },
  { id:'winterHat1',           name:'winter hat 1' },
  { id:'winterHat02',          name:'winter hat 2' },
  { id:'winterHat03',          name:'winter hat 3' },
  { id:'winterHat04',          name:'winter hat 4' },
];

const EYES_OPTS = [
  { id:'default',   name:'default' },
  { id:'happy',     name:'happy ^_^' },
  { id:'squint',    name:'squint ._.' },
  { id:'wink',      name:'wink ;)' },
  { id:'winkWacky', name:'wacky wink' },
  { id:'hearts',    name:'hearts <3' },
  { id:'side',      name:'side eye' },
  { id:'surprised', name:'surprised' },
  { id:'eyeRoll',   name:'eye roll' },
  { id:'cry',       name:'crying' },
  { id:'closed',    name:'closed' },
  { id:'xDizzy',    name:'x_x' },
];

const BROWS_OPTS = [
  { id:'defaultNatural',        name:'default' },
  { id:'raisedExcitedNatural',  name:'raised' },
  { id:'angryNatural',          name:'angry' },
  { id:'flatNatural',           name:'flat' },
  { id:'frownNatural',          name:'frown' },
  { id:'sadConcernedNatural',   name:'sad' },
  { id:'upDownNatural',         name:'up-down' },
  { id:'unibrowNatural',        name:'unibrow' },
  { id:'default',               name:'default (thin)' },
  { id:'raisedExcited',         name:'raised (thin)' },
  { id:'angry',                 name:'angry (thin)' },
  { id:'sadConcerned',          name:'sad (thin)' },
  { id:'upDown',                name:'up-down (thin)' },
];

const MOUTH_OPTS = [
  { id:'default',    name:'default' },
  { id:'smile',      name:'smile :)' },
  { id:'twinkle',    name:'twinkle' },
  { id:'tongue',     name:'tongue :P' },
  { id:'eating',     name:'eating' },
  { id:'concerned',  name:'concerned' },
  { id:'disbelief',  name:'disbelief' },
  { id:'grimace',    name:'grimace' },
  { id:'sad',        name:'sad :(' },
  { id:'serious',    name:'serious' },
  { id:'screamOpen', name:'screaming' },
  { id:'vomit',      name:'sick' },
];

const CLOTHING_OPTS = [
  { id:'blazerAndShirt',   name:'blazer + shirt' },
  { id:'blazerAndSweater', name:'blazer + sweater' },
  { id:'collarAndSweater', name:'collar + sweater' },
  { id:'graphicShirt',     name:'graphic tee' },
  { id:'hoodie',           name:'hoodie' },
  { id:'overall',          name:'overalls' },
  { id:'shirtCrewNeck',    name:'crew neck' },
  { id:'shirtScoopNeck',   name:'scoop neck' },
  { id:'shirtVNeck',       name:'v neck' },
];

const ACCESSORIES_OPTS = [
  { id:'none',           name:'none' },
  { id:'prescription01', name:'rx glasses 1' },
  { id:'prescription02', name:'rx glasses 2' },
  { id:'round',          name:'round glasses' },
  { id:'sunglasses',     name:'sunglasses' },
  { id:'wayfarers',      name:'wayfarers' },
  { id:'kurt',           name:'kurt' },
  { id:'eyepatch',       name:'eyepatch' },
];

const BEARD_OPTS = [
  { id:'none',           name:'none' },
  { id:'beardLight',     name:'light beard' },
  { id:'beardMedium',    name:'medium beard' },
  { id:'beardMajestic',  name:'majestic beard' },
  { id:'moustacheFancy', name:'fancy moustache' },
  { id:'moustacheMagnum',name:'magnum moustache' },
];

export const PARTS = {
  hair:        HAIR_OPTS,
  hairColor:   HAIR_COLOR_PARTS,
  eyes:        EYES_OPTS,
  brows:       BROWS_OPTS,
  mouth:       MOUTH_OPTS,
  clothing:    CLOTHING_OPTS,
  accessories: ACCESSORIES_OPTS,
  beard:       BEARD_OPTS,
  background:  BG_OPTS,
};

export const CATEGORY_ORDER = ['skin','hair','hairColor','eyes','brows','mouth','clothing','accessories','beard','background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: {
    hair:        'shortRound',
    hairColor:   'darkbrown',
    eyes:        'default',
    brows:       'defaultNatural',
    mouth:       'smile',
    clothing:    'hoodie',
    accessories: 'none',
    beard:       'none',
    background:  'none',
  },
};

const R = makeRenderer({
  createAvatar, style: avataaars,
  PARTS, CATEGORY_ORDER, DEFAULT_AVATAR,
  hairColorKey: 'hairColor',
  catKey: {
    hair:        'top',
    eyes:        'eyes',
    brows:       'eyebrows',
    mouth:       'mouth',
    clothing:    'clothing',
    accessories: 'accessories',
    beard:       'facialHair',
  },
  probCats: {
    accessories: 'accessoriesProbability',
    beard:       'facialHairProbability',
  },
});

export const { SKIN_TONES, ASPECT_RATIO, renderAvatarFull, renderPartPreview } = R;
export { STYLES, BODY, SKULL };
