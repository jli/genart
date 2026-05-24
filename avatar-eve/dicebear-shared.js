// Shared data and factory for DiceBear renderers.
// Each renderer file: imports from here, CDN-imports its style, calls makeRenderer().

export const SKIN_TONES = [
  { id:'pale',  color:'#ffe6d3' },
  { id:'fair',  color:'#fcd0a8' },
  { id:'olive', color:'#e0a878' },
  { id:'brown', color:'#a16e4b' },
  { id:'deep',  color:'#65422a' },
];
export const SKIN_MAP = { pale:'ffe6d3', fair:'fcd0a8', olive:'e0a878', brown:'a16e4b', deep:'65422a' };

export const HAIR_COLORS = [
  { id:'black',    name:'black',      hex:'1a1419' },
  { id:'darkbrown',name:'dark brown', hex:'3a2418' },
  { id:'brown',    name:'brown',      hex:'a86a3a' },
  { id:'auburn',   name:'auburn',     hex:'8b3a2a' },
  { id:'blonde',   name:'blonde',     hex:'d4a842' },
  { id:'platinum', name:'platinum',   hex:'e8dcc8' },
  { id:'grey',     name:'grey',       hex:'9a9a9a' },
  { id:'white',    name:'white',      hex:'f5f0eb' },
  { id:'pink',     name:'pink',       hex:'e86b9a' },
  { id:'red',      name:'red',        hex:'cc2200' },
  { id:'purple',   name:'purple',     hex:'845ec2' },
  { id:'teal',     name:'teal',       hex:'2a9d8f' },
  { id:'blue',     name:'blue',       hex:'4472c4' },
  { id:'green',    name:'green',      hex:'4a8a3c' },
];
export const HAIR_COLOR_MAP   = Object.fromEntries(HAIR_COLORS.map(h => [h.id, h.hex]));
export const HAIR_COLOR_PARTS = HAIR_COLORS.map(h => ({ id: h.id, name: h.name, _hex: h.hex }));

export const BG_OPTS = [
  { id:'none',    name:'none',         colors:[],                  type:[] },
  { id:'cream',   name:'cream',        colors:['fdf6e3'],          type:['solid'] },
  { id:'pink',    name:'pink',         colors:['ffb3c6'],          type:['solid'] },
  { id:'purple',  name:'purple',       colors:['c9b8ff'],          type:['solid'] },
  { id:'sky',     name:'sky blue',     colors:['b8d8ff'],          type:['solid'] },
  { id:'mint',    name:'mint',         colors:['b8f0e0'],          type:['solid'] },
  { id:'yellow',  name:'yellow',       colors:['fff3b8'],          type:['solid'] },
  { id:'peach',   name:'peach',        colors:['ffd5b0'],          type:['solid'] },
  { id:'sage',    name:'sage',         colors:['c8dcc4'],          type:['solid'] },
  { id:'blush',   name:'blush',        colors:['f7c5b8'],          type:['solid'] },
  { id:'lilac',   name:'lilac',        colors:['d8c5f0'],          type:['solid'] },
  { id:'sunset',  name:'sunset',       colors:['ffb347','ff6b6b'], type:['gradientLinear'] },
  { id:'ocean',   name:'ocean',        colors:['667eea','64b3f4'], type:['gradientLinear'] },
  { id:'rose',    name:'rose',         colors:['f953c6','b91d73'], type:['gradientLinear'] },
  { id:'forest',  name:'forest',       colors:['56ab2f','a8e063'], type:['gradientLinear'] },
  { id:'aurora',  name:'aurora',       colors:['a8edea','fed6e3'], type:['gradientLinear'] },
  { id:'dusk',    name:'dusk',         colors:['f093fb','f5576c'], type:['gradientLinear'] },
  { id:'citrus',  name:'citrus',       colors:['f6d365','fda085'], type:['gradientLinear'] },
  { id:'cotton',  name:'cotton candy', colors:['fbc2eb','a6c1ee'], type:['gradientLinear'] },
  { id:'ember',   name:'ember',        colors:['ff9966','ff5e62'], type:['gradientLinear'] },
];
export const BG_MAP = Object.fromEntries(BG_OPTS.map(b => [b.id, b]));

export const STYLES       = ['default'];
export const BODY         = () => '';
export const SKULL        = () => '';
export const ASPECT_RATIO = '1';

export const range = (n, prefix = 'variant') =>
  Array.from({ length: n }, (_, i) => ({
    id:   `${prefix}${String(i + 1).padStart(2, '0')}`,
    name: `style ${i + 1}`,
  }));

export function dicebearSvg(raw) {
  // DiceBear SVGs use fixed (non-seeded) IDs like "viewboxMask". When multiple
  // SVGs are in the DOM simultaneously, duplicate IDs corrupt clipPath lookups
  // across all SVGs. Append a unique suffix to every id= and its references.
  const uid = Math.random().toString(36).slice(2, 8);
  let s = raw
    .replace(/ id="([^"]*)"/g, ` id="$1-${uid}"`)
    .replace(/url\(#([^)]*)\)/g, `url(#$1-${uid})`)
    .replace(/((?:xlink:)?href)="#([^"]*)"/g, `$1="#$2-${uid}"`);

  return s.replace(/<svg\b([^>]*)>/, (_, attrs) => {
    const cleaned = attrs
      .replace(/ (?:width|height)="[^"]*"/g, '')
      .replace(/ style="[^"]*"/g, '');
    return `<svg width="100%" height="100%" style="display:block;width:100%;height:100%"${cleaned}>`;
  });
}

/**
 * makeRenderer — builds a complete renderer module object from a DiceBear style.
 *
 * @param createAvatar  — DiceBear createAvatar function
 * @param style         — DiceBear style object (e.g. micah, avataaars)
 * @param PARTS         — { [category]: [{id, name, ...}] }
 * @param CATEGORY_ORDER — string[]
 * @param DEFAULT_AVATAR — { skin, parts }
 * @param catKey        — { ourCategory: 'dicebearOptionKey' }
 * @param probCats      — { ourCategory: 'dicebearProbabilityKey' } for optional features
 * @param skinKey       — DiceBear key for skin color (default 'skinColor')
 * @param hasSkin       — whether this style supports skin color (default true)
 * @param hairColorKey  — DiceBear key for hair color, or null if unsupported
 */
export function makeRenderer({
  createAvatar, style,
  PARTS, CATEGORY_ORDER, DEFAULT_AVATAR,
  catKey,
  probCats   = {},
  skinKey    = 'skinColor',
  hasSkin    = true,
  hairColorKey = null,
}) {
  function buildOpts(avatar) {
    const p    = avatar.parts;
    const opts = { seed: avatar.id || 'default' };

    if (hasSkin)     opts[skinKey]      = [SKIN_MAP[avatar.skin] || 'fcd0a8'];
    if (hairColorKey) opts[hairColorKey] = [HAIR_COLOR_MAP[p.hairColor] || '3a2418'];

    for (const pk of Object.values(probCats)) opts[pk] = 0;

    for (const [cat, key] of Object.entries(catKey)) {
      const val = p[cat];
      if (val && val !== 'none') {
        opts[key] = [val];
        if (probCats[cat]) opts[probCats[cat]] = 100;
      }
    }

    const bg = BG_MAP[p.background];
    if (bg?.colors.length) { opts.backgroundColor = bg.colors; opts.backgroundType = bg.type; }

    return opts;
  }

  const _render = (opts) => dicebearSvg(createAvatar(style, opts).toString());

  function renderPartPreview(avatar, category, partId) {
    const opts = buildOpts(avatar);

    if (category === 'background') {
      const bg = BG_MAP[partId];
      if (bg?.colors.length) { opts.backgroundColor = bg.colors; opts.backgroundType = bg.type; }
      else { delete opts.backgroundColor; delete opts.backgroundType; }
    } else if (category === 'skin' && hasSkin) {
      opts[skinKey] = [SKIN_MAP[partId] || 'fcd0a8'];
    } else if (category === 'hairColor' && hairColorKey) {
      opts[hairColorKey] = [HAIR_COLOR_MAP[partId] || '3a2418'];
    } else {
      const key = catKey[category];
      if (key) {
        if (partId === 'none') {
          delete opts[key];
          if (probCats[category]) opts[probCats[category]] = 0;
        } else {
          opts[key] = [partId];
          if (probCats[category]) opts[probCats[category]] = 100;
        }
      }
    }
    return _render(opts);
  }

  return {
    PARTS, CATEGORY_ORDER, DEFAULT_AVATAR,
    SKIN_TONES: hasSkin ? SKIN_TONES : [],
    STYLES, BODY, SKULL, ASPECT_RATIO,
    renderAvatarFull:  (avatar) => _render(buildOpts(avatar)),
    renderPartPreview,
  };
}
