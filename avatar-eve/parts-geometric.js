// Canvas: viewBox 0 0 400 600. Chibi proportions.
// Head center (200,192), rx=92, ry=97 → top y=95, chin y=289
// Ear bumps: cx=108/292, cy=207, rx=11, ry=15
// Hairline y≈150, x=120..280 | Ear level y=207, x=108..292
// Face: brows y=197, eyes y=222, blush y=233, nose y=244, mouth y=258
// Torso y=289–452. Arms x=93–129 / x=271–307, y=345–443
// Waistband y=426–452. Legs x=133–184 / x=216–267, y=452–557
// Feet y=555–572

const LINE = '#2d2333';
const SW = 3;

export const SKIN_TONES = [
  { id: 'pale',  color: '#ffe6d3' },
  { id: 'fair',  color: '#fcd0a8' },
  { id: 'olive', color: '#e0a878' },
  { id: 'brown', color: '#a16e4b' },
  { id: 'deep',  color: '#65422a' },
];

export const ASPECT_RATIO = '2/3';
export const STYLES = ['goth', 'punk', 'nerd', 'jock', 'angelic', 'anime', 'badgirl', 'goodgirl', 'normie'];

export const CATEGORY_ORDER = ['skin', 'eyes', 'brows', 'mouth', 'hair', 'shirt', 'pants', 'shoes', 'accessories', 'background'];

export const DEFAULT_AVATAR = {
  skin: 'fair',
  parts: {
    eyes: 'dot',
    brows: 'normal',
    mouth: 'neutral',
    hair: 'bald',
    shirt: 'plain-tee',
    pants: 'jeans',
    shoes: 'sneakers',
    accessories: [],
    background: 'plain',
  },
};

const STAR = (cx, cy, r, fill) =>
  `<path transform="translate(${cx},${cy}) scale(${r/10})" d="M0,-10 L3,-3 L10,-3 L4,2 L7,9 L0,5 L-7,9 L-4,2 L-10,-3 L-3,-3 Z" fill="${fill}"/>`;

export const BODY = (skin) => `
  <path d="M183,289 L183,310 Q172,324 122,356 L116,452 L284,452 L278,356 Q228,324 217,310 L217,289 Z"
        fill="${skin}" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
  <ellipse cx="200" cy="310" rx="20" ry="8" fill="${LINE}" opacity="0.09"/>
  <path d="M165,299 Q183,293 200,295 Q217,293 235,299"
        fill="none" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round" opacity="0.18"/>
  <path d="M238,320 Q252,342 266,382 Q272,414 278,448"
        fill="none" stroke="${LINE}" stroke-width="7" stroke-linecap="round" opacity="0.055"/>
  <rect x="93"  y="345" width="36" height="98" rx="17"
        fill="${skin}" stroke="${LINE}" stroke-width="${SW}"/>
  <rect x="113" y="352" width="9"  height="84" rx="4"
        fill="${LINE}" opacity="0.07"/>
  <rect x="271" y="345" width="36" height="98" rx="17"
        fill="${skin}" stroke="${LINE}" stroke-width="${SW}"/>
  <rect x="278" y="352" width="9"  height="84" rx="4"
        fill="${LINE}" opacity="0.07"/>
  <rect x="133" y="452" width="51" height="105" rx="14"
        fill="${skin}" stroke="${LINE}" stroke-width="${SW}"/>
  <rect x="152" y="460" width="11" height="89" rx="5"
        fill="${LINE}" opacity="0.07"/>
  <rect x="216" y="452" width="51" height="105" rx="14"
        fill="${skin}" stroke="${LINE}" stroke-width="${SW}"/>
  <rect x="224" y="460" width="11" height="89" rx="5"
        fill="${LINE}" opacity="0.07"/>
`;

export const SKULL = (skin) => `
  <ellipse cx="200" cy="192" rx="92" ry="97"
           fill="${skin}" stroke="${LINE}" stroke-width="${SW}"/>
  <ellipse cx="108" cy="207" rx="11" ry="15"
           fill="${skin}" stroke="${LINE}" stroke-width="${SW}"/>
  <ellipse cx="292" cy="207" rx="11" ry="15"
           fill="${skin}" stroke="${LINE}" stroke-width="${SW}"/>
  <ellipse cx="109" cy="208" rx="5"  ry="8"  fill="${LINE}" opacity="0.10"/>
  <ellipse cx="291" cy="208" rx="5"  ry="8"  fill="${LINE}" opacity="0.10"/>
  <ellipse cx="184" cy="147" rx="47" ry="25" fill="white" opacity="0.26" transform="rotate(-6 184 147)"/>
  <ellipse cx="153" cy="198" rx="18" ry="11" fill="white" opacity="0.16"/>
  <ellipse cx="247" cy="198" rx="18" ry="11" fill="white" opacity="0.16"/>
  <ellipse cx="200" cy="272" rx="54" ry="20" fill="${LINE}" opacity="0.07"/>
  <ellipse cx="122" cy="228" rx="20" ry="54" fill="${LINE}" opacity="0.05" transform="rotate(10 122 228)"/>
  <ellipse cx="145" cy="237" rx="30" ry="13" fill="#ff8fab" opacity="0.40" transform="rotate(-6 145 237)"/>
  <ellipse cx="255" cy="237" rx="30" ry="13" fill="#ff8fab" opacity="0.40" transform="rotate(6 255 237)"/>
  <path d="M194,246 Q198,255 202,251" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round" opacity="0.32"/>
  <ellipse cx="200" cy="263" rx="15" ry="5"  fill="white" opacity="0.18"/>
`;

export const PARTS = {

  // ── EYES ──────────────────────────────────────────────────────────
  eyes: [
    { id: 'dot', name: 'simple dots', tags: ['normie', 'nerd'], svg: `
      <path d="M152,218 Q165,210 178,218" fill="none" stroke="${LINE}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M222,218 Q235,210 248,218" fill="none" stroke="${LINE}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="153" y1="218" x2="149" y2="213" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="177" y1="218" x2="181" y2="213" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="223" y1="218" x2="219" y2="213" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="247" y1="218" x2="251" y2="213" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="165" cy="223" r="9"   fill="#3a2018"/>
      <circle cx="235" cy="223" r="9"   fill="#3a2018"/>
      <circle cx="165" cy="224" r="6"   fill="#1a0c0a"/>
      <circle cx="235" cy="224" r="6"   fill="#1a0c0a"/>
      <circle cx="169" cy="218" r="3"   fill="white"/>
      <circle cx="239" cy="218" r="3"   fill="white"/>
      <circle cx="162" cy="228" r="1.5" fill="white" opacity="0.55"/>
      <circle cx="232" cy="228" r="1.5" fill="white" opacity="0.55"/>
      <path d="M156,230 Q165,233 174,230" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round" opacity="0.30"/>
      <path d="M226,230 Q235,233 244,230" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round" opacity="0.30"/>
    `},
    { id: 'big', name: 'big anime', tags: ['anime', 'goodgirl'], svg: `
      <ellipse cx="165" cy="222" rx="16" ry="20" fill="white" stroke="${LINE}" stroke-width="${SW}"/>
      <ellipse cx="165" cy="225" rx="11" ry="15" fill="#5b3a2b"/>
      <ellipse cx="165" cy="228" rx="9"  ry="11" fill="#3a2018"/>
      <ellipse cx="165" cy="230" rx="6"  ry="7"  fill="#130a08"/>
      <circle  cx="170" cy="213" r="5.5" fill="white"/>
      <circle  cx="159" cy="230" r="2.5" fill="white" opacity="0.7"/>
      <circle  cx="169" cy="233" r="1.5" fill="white" opacity="0.5"/>
      <path d="M149,205 Q165,199 181,205" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <line x1="150" y1="206" x2="145" y2="199" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <line x1="158" y1="202" x2="155" y2="196" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <line x1="172" y1="202" x2="172" y2="195" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <line x1="180" y1="205" x2="184" y2="199" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <path d="M149,236 Q165,241 181,236" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>
      <ellipse cx="235" cy="222" rx="16" ry="20" fill="white" stroke="${LINE}" stroke-width="${SW}"/>
      <ellipse cx="235" cy="225" rx="11" ry="15" fill="#5b3a2b"/>
      <ellipse cx="235" cy="228" rx="9"  ry="11" fill="#3a2018"/>
      <ellipse cx="235" cy="230" rx="6"  ry="7"  fill="#130a08"/>
      <circle  cx="240" cy="213" r="5.5" fill="white"/>
      <circle  cx="229" cy="230" r="2.5" fill="white" opacity="0.7"/>
      <circle  cx="239" cy="233" r="1.5" fill="white" opacity="0.5"/>
      <path d="M219,205 Q235,199 251,205" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <line x1="220" y1="206" x2="215" y2="199" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <line x1="228" y1="202" x2="225" y2="196" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <line x1="242" y1="202" x2="242" y2="195" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <line x1="250" y1="205" x2="254" y2="199" stroke="${LINE}" stroke-width="2"   stroke-linecap="round"/>
      <path d="M219,236 Q235,241 251,236" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>
    `},
    { id: 'sleepy', name: 'sleepy', tags: ['goth', 'badgirl'], svg: `
      <path d="M150,220 Q165,228 180,220" fill="${LINE}" stroke="${LINE}" stroke-width="1"/>
      <path d="M220,220 Q235,228 250,220" fill="${LINE}" stroke="${LINE}" stroke-width="1"/>
      <path d="M150,218 Q165,212 180,218" fill="none" stroke="${LINE}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <path d="M220,218 Q235,212 250,218" fill="none" stroke="${LINE}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="151" y1="219" x2="147" y2="214" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="179" y1="219" x2="183" y2="214" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="221" y1="219" x2="217" y2="214" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="249" y1="219" x2="253" y2="214" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="165" cy="233" rx="9" ry="3.5" fill="#c090b0" opacity="0.55"/>
      <ellipse cx="235" cy="233" rx="9" ry="3.5" fill="#c090b0" opacity="0.55"/>
    `},
    { id: 'happy', name: 'happy ˆ_ˆ', tags: ['goodgirl', 'normie', 'anime'], svg: `
      <path d="M150,222 Q165,210 180,222" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <path d="M220,222 Q235,210 250,222" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <path d="M153,218 L150,212 M165,216 L165,209 M177,218 L180,212" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M223,218 L220,212 M235,216 L235,209 M247,218 L250,212" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
    `},
    { id: 'wink', name: 'wink', tags: ['badgirl', 'anime'], svg: `
      <path d="M150,222 Q165,210 180,222" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <path d="M151,220 Q165,213 179,220" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
      <line x1="151" y1="222" x2="147" y2="217" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="179" y1="222" x2="183" y2="217" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="235" cy="222" rx="15" ry="19" fill="white" stroke="${LINE}" stroke-width="${SW}"/>
      <ellipse cx="235" cy="225" rx="10" ry="14" fill="#5b3a2b"/>
      <ellipse cx="235" cy="228" rx="7"  ry="9"  fill="#3a2018"/>
      <circle  cx="240" cy="215" r="4.5" fill="white"/>
      <circle  cx="229" cy="230" r="2"   fill="white" opacity="0.7"/>
      <path d="M220,205 Q235,199 250,205" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="221" y1="206" x2="216" y2="200" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="249" y1="206" x2="254" y2="200" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
    `},
    { id: 'star', name: 'star eyes', tags: ['goodgirl', 'anime'], svg: `
      <ellipse cx="165" cy="222" rx="15" ry="19" fill="white" stroke="${LINE}" stroke-width="${SW}"/>
      ${STAR(165, 222, 10, '#ff6f91')}
      <circle cx="172" cy="214" r="3.5" fill="white" opacity="0.9"/>
      <circle cx="158" cy="228" r="2"   fill="white" opacity="0.6"/>
      <path d="M150,203 Q165,197 180,203" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="151" y1="204" x2="146" y2="198" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="179" y1="204" x2="184" y2="198" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="235" cy="222" rx="15" ry="19" fill="white" stroke="${LINE}" stroke-width="${SW}"/>
      ${STAR(235, 222, 10, '#ff6f91')}
      <circle cx="242" cy="214" r="3.5" fill="white" opacity="0.9"/>
      <circle cx="228" cy="228" r="2"   fill="white" opacity="0.6"/>
      <path d="M220,203 Q235,197 250,203" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="221" y1="204" x2="216" y2="198" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="249" y1="204" x2="254" y2="198" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
    `},
    { id: 'narrow', name: 'sharp', tags: ['goth', 'badgirl', 'punk'], svg: `
      <path d="M148,219 Q165,211 182,217 L182,227 Q165,231 148,227 Z" fill="white" stroke="${LINE}" stroke-width="2"/>
      <ellipse cx="167" cy="223" rx="7" ry="5.5" fill="${LINE}"/>
      <circle  cx="170" cy="220" r="2"   fill="white"/>
      <circle  cx="163" cy="225" r="1"   fill="white" opacity="0.5"/>
      <path d="M148,219 Q165,211 182,217" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="148" y1="220" x2="144" y2="215" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="182" y1="218" x2="186" y2="213" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M218,219 Q235,211 252,217 L252,227 Q235,231 218,227 Z" fill="white" stroke="${LINE}" stroke-width="2"/>
      <ellipse cx="233" cy="223" rx="7" ry="5.5" fill="${LINE}"/>
      <circle  cx="236" cy="220" r="2"   fill="white"/>
      <circle  cx="229" cy="225" r="1"   fill="white" opacity="0.5"/>
      <path d="M218,219 Q235,211 252,217" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="218" y1="220" x2="214" y2="215" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="252" y1="218" x2="256" y2="213" stroke="${LINE}" stroke-width="1.5" stroke-linecap="round"/>
    `},
    { id: 'closed', name: 'serene', tags: ['angelic', 'goodgirl'], svg: `
      <path d="M152,222 Q165,227 178,222" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M222,222 Q235,227 248,222" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M155,219 L150,213 M165,217 L165,210 M175,219 L180,213" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
      <path d="M225,219 L220,213 M235,217 L235,210 M245,219 L250,213" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
    `},
    { id: 'xx', name: 'x_x', tags: ['punk'], svg: `
      <path d="M153,212 L178,233 M178,212 L153,233" stroke="${LINE}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M222,212 L247,233 M247,212 L222,233" stroke="${LINE}" stroke-width="4.5" stroke-linecap="round"/>
    `},
  ],

  // ── BROWS ─────────────────────────────────────────────────────────
  brows: [
    { id: 'normal', name: 'normal', tags: ['normie', 'nerd'], svg: `
      <path d="M150,197 Q165,191 180,197" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <path d="M220,197 Q235,191 250,197" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
    `},
    { id: 'thick', name: 'thick', tags: ['jock', 'punk'], svg: `
      <path d="M148,197 Q165,188 182,197" fill="none" stroke="${LINE}" stroke-width="8" stroke-linecap="round"/>
      <path d="M218,197 Q235,188 252,197" fill="none" stroke="${LINE}" stroke-width="8" stroke-linecap="round"/>
    `},
    { id: 'thin', name: 'thin arch', tags: ['goth', 'badgirl', 'goodgirl'], svg: `
      <path d="M150,196 Q165,193 180,197" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
      <path d="M220,197 Q235,193 250,196" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
    `},
    { id: 'angry', name: 'angry', tags: ['punk', 'badgirl'], svg: `
      <path d="M150,202 L182,191" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
      <path d="M250,202 L218,191" stroke="${LINE}" stroke-width="5" stroke-linecap="round"/>
    `},
    { id: 'raised', name: 'raised', tags: ['anime', 'goodgirl'], svg: `
      <path d="M150,200 Q165,187 182,193" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <path d="M218,193 Q235,187 250,200" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
    `},
    { id: 'pierced', name: 'pierced', tags: ['punk', 'badgirl'], svg: `
      <path d="M150,197 Q165,191 180,197" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <path d="M220,197 Q235,191 250,197" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="183" cy="200" r="3.5" fill="#c0c0c0" stroke="${LINE}" stroke-width="1.5"/>
      <circle cx="217" cy="200" r="3.5" fill="#c0c0c0" stroke="${LINE}" stroke-width="1.5"/>
    `},
  ],

  // ── MOUTH ─────────────────────────────────────────────────────────
  mouth: [
    { id: 'neutral', name: 'neutral', tags: ['normie', 'nerd'], svg: `
      <line x1="190" y1="258" x2="210" y2="258" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="200" cy="259" rx="9" ry="3" fill="#d8567c" opacity="0.28"/>
    `},
    { id: 'smile', name: 'smile', tags: ['normie', 'goodgirl', 'jock'], svg: `
      <path d="M188,255 Q200,268 212,255" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
      <path d="M191,260 Q200,266 209,260" fill="#d8567c" opacity="0.35"/>
    `},
    { id: 'big-smile', name: 'big smile', tags: ['anime', 'goodgirl', 'jock'], svg: `
      <path d="M183,253 Q200,276 217,253 Z" fill="white" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M186,257 L214,257" stroke="${LINE}" stroke-width="1.5"/>
    `},
    { id: 'smirk', name: 'smirk', tags: ['badgirl', 'punk', 'goth'], svg: `
      <path d="M188,258 Q200,261 217,251" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
    `},
    { id: 'frown', name: 'frown', tags: ['goth', 'punk'], svg: `
      <path d="M188,262 Q200,252 212,262" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
    `},
    { id: 'kissy', name: 'kissy', tags: ['badgirl', 'goodgirl'], svg: `
      <path d="M194,255 Q200,247 206,255 Q200,265 194,255 Z" fill="#d8567c" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'o', name: 'surprised', tags: ['anime'], svg: `
      <ellipse cx="200" cy="259" rx="6" ry="8" fill="#3a1f2b" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'tongue', name: 'tongue out', tags: ['punk', 'anime'], svg: `
      <path d="M188,255 Q200,261 212,255" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
      <path d="M197,258 Q200,274 204,268 Q208,262 204,258 Z" fill="#d8567c" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'fangs', name: 'fangs', tags: ['goth', 'badgirl'], svg: `
      <path d="M188,255 Q200,265 212,255" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
      <path d="M196,257 L193,267 L198,262 Z" fill="white" stroke="${LINE}" stroke-width="1.5"/>
      <path d="M204,257 L207,267 L202,262 Z" fill="white" stroke="${LINE}" stroke-width="1.5"/>
    `},
  ],

  // ── HAIR ──────────────────────────────────────────────────────────
  // Hairline y≈150, x=120..280. Top of head y=95. Ears y=207, x=108/292.
  hair: [
    { id: 'bald', name: 'bald', tags: ['nerd', 'normie', 'jock'], svg: `` },

    { id: 'short-mess', name: 'short messy', tags: ['normie', 'jock'], svg: `
      <path d="M119,160
               Q107,186 105,160 Q102,112 200,98 Q298,112 295,160
               Q291,186 281,160
               Q268,178 253,153 Q236,177 218,149 Q207,170 200,148
               Q189,170 178,150 Q160,176 145,155 Q130,176 119,160 Z"
            fill="#3a2418" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M144,148 Q165,134 196,132" fill="none" stroke="white" stroke-width="9" stroke-linecap="round" opacity="0.22"/>
      <path d="M166,128 Q182,118 200,116" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.15"/>
    `},

    { id: 'mohawk-pink', name: 'pink mohawk', tags: ['punk', 'badgirl'], svg: `
      <path d="M110,202 Q107,152 123,140 L135,153 Q121,164 115,198 Z" fill="#1a1a1a" opacity="0.7"/>
      <path d="M290,202 Q293,152 277,140 L265,153 Q279,164 285,198 Z" fill="#1a1a1a" opacity="0.7"/>
      <path d="M183,152 Q182,128 200,44 Q218,128 217,152
               Q210,160 200,158 Q190,160 183,152 Z"
            fill="#ff3366" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
    `},

    { id: 'long-black', name: 'long black', tags: ['goth', 'badgirl', 'anime'], svg: `
      <path d="M130,204 L128,435 L80,430 Q84,280 108,204 Z"
            fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M270,204 L272,435 L320,430 Q316,280 292,204 Z"
            fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M108,204 Q104,106 200,95 Q296,106 292,204
               Q274,172 256,160 Q232,148 200,152
               Q168,148 144,160 Q126,172 108,204 Z"
            fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M142,158 Q166,144 196,146" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" opacity="0.18"/>
      <path d="M90,250 Q86,320 84,380"    fill="none" stroke="white" stroke-width="5"  stroke-linecap="round" opacity="0.12"/>
    `},

    { id: 'twin-tails', name: 'twin tails', tags: ['anime', 'goodgirl'], svg: `
      <path d="M120,155 Q107,180 105,152 Q102,106 200,95 Q298,106 295,152
               Q293,180 280,155 Q267,172 250,153 Q228,172 200,150
               Q172,172 150,153 Z"
            fill="#d4549a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M120,155 Q104,182 98,342 Q101,368 115,364 L121,328 L137,184 Z"
            fill="#d4549a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M280,155 Q296,182 302,342 Q299,368 285,364 L279,328 L263,184 Z"
            fill="#d4549a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <circle cx="120" cy="162" r="11" fill="#ffafcc" stroke="${LINE}" stroke-width="2"/>
      <circle cx="280" cy="162" r="11" fill="#ffafcc" stroke="${LINE}" stroke-width="2"/>
      <path d="M146,150 Q168,138 198,140" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.30"/>
      <path d="M100,200 Q96,260 98,310"   fill="none" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.20"/>
      <path d="M300,200 Q304,260 302,310"  fill="none" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.20"/>
    `},

    { id: 'bob', name: 'bob cut', tags: ['normie', 'goodgirl', 'anime'], svg: `
      <path d="M107,200 Q103,120 200,97 Q297,120 293,200
               L291,252 Q270,262 255,252
               Q268,193 200,168 Q132,193 145,252
               Q130,262 109,252 Z"
            fill="#5c3a1f" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M138,162 Q164,145 196,142" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" opacity="0.22"/>
      <path d="M162,132 Q180,122 200,120"  fill="none" stroke="white" stroke-width="5"  stroke-linecap="round" opacity="0.16"/>
    `},

    { id: 'buzz', name: 'buzz cut', tags: ['jock', 'punk'], svg: `
      <path d="M112,162 Q110,98 200,90 Q290,98 288,162
               Q270,150 200,146 Q130,150 112,162 Z"
            fill="#3a2418" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M142,146 Q168,132 200,130 Q226,132 254,140" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" opacity="0.20"/>
    `},

    { id: 'ponytail', name: 'ponytail', tags: ['jock', 'normie', 'goodgirl'], svg: `
      <path d="M112,162 Q110,100 200,92 Q290,100 288,162
               Q270,150 250,144 Q228,138 200,141
               Q172,138 150,144 Q130,150 112,162 Z"
            fill="#a86a3a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M288,164 Q326,215 320,330 Q302,316 298,263 Q292,200 290,164 Z"
            fill="#a86a3a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <circle cx="290" cy="167" r="9" fill="#ff6f91" stroke="${LINE}" stroke-width="2"/>
      <path d="M142,146 Q168,132 200,130 Q224,132 252,140" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" opacity="0.22"/>
      <path d="M294,190 Q308,230 306,290" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.20"/>
    `},

    { id: 'beanie', name: 'beanie', tags: ['normie', 'nerd', 'punk'], svg: `
      <path d="M116,202 Q113,152 122,144 Q124,156 122,202 Z" fill="#3a2418"/>
      <path d="M284,202 Q287,152 278,144 Q276,156 278,202 Z" fill="#3a2418"/>
      <path d="M116,184 Q118,108 200,100 Q282,108 284,184 L290,202 L110,202 Z"
            fill="#3b6b8c" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <rect x="108" y="198" width="184" height="14" fill="#2a4d66" stroke="${LINE}" stroke-width="${SW}"/>
      <circle cx="200" cy="98" r="13" fill="#ff6f91" stroke="${LINE}" stroke-width="${SW}"/>
      <path d="M146,152 Q172,136 200,132 Q226,136 254,146" fill="none" stroke="white" stroke-width="9" stroke-linecap="round" opacity="0.18"/>
    `},

    { id: 'witch-hat', name: 'witch hat', tags: ['goth', 'badgirl'], svg: `
      <path d="M110,204 Q107,153 123,140 L133,154 Q121,166 117,204 Z" fill="#1a1419"/>
      <path d="M290,204 Q293,153 277,140 L267,154 Q279,166 283,204 Z" fill="#1a1419"/>
      <ellipse cx="200" cy="152" rx="110" ry="14" fill="#1a1419" stroke="${LINE}" stroke-width="${SW}"/>
      <path d="M150,152 L250,152 L228,36 Q215,52 206,44 Q200,38 194,44 Q185,52 172,36 Z"
            fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <rect x="152" y="142" width="96" height="12" fill="#845ec2" stroke="${LINE}" stroke-width="2"/>
      ${STAR(168, 148, 4, '#ffd700')}
    `},

    { id: 'angel-wavy', name: 'angel waves', tags: ['angelic', 'goodgirl'], svg: `
      <path d="M108,162 Q96,258 118,342 Q130,298 116,252 Q108,205 108,162 Z"
            fill="#f5d670" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M292,162 Q304,258 282,342 Q270,298 284,252 Q292,205 292,162 Z"
            fill="#f5d670" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M112,165 Q104,116 106,100 Q118,90 200,86 Q282,90 294,100
               Q296,116 288,165 Q274,146 258,160 Q242,142 226,158
               Q212,142 200,154 Q188,142 174,158
               Q158,142 142,160 Q126,146 112,165 Z"
            fill="#f5d670" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M148,150 Q170,136 200,134 Q226,136 252,146" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" opacity="0.38"/>
      <path d="M110,195 Q106,245 110,295" fill="none" stroke="white" stroke-width="5"  stroke-linecap="round" opacity="0.28"/>
    `},

    { id: 'bun', name: 'top bun', tags: ['nerd', 'normie'], svg: `
      <path d="M116,203 Q113,130 200,115 Q287,130 284,203
               Q268,192 200,188 Q132,192 116,203 Z"
            fill="#3a2418" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <circle cx="200" cy="103" r="31" fill="#3a2418" stroke="${LINE}" stroke-width="${SW}"/>
      <path d="M179,103 Q200,94 221,103" fill="none" stroke="${LINE}" stroke-width="1.5"/>
      <path d="M144,160 Q168,148 198,146" fill="none" stroke="white" stroke-width="9" stroke-linecap="round" opacity="0.20"/>
      <circle cx="192" cy="88"  r="13"   fill="white" opacity="0.20"/>
    `},

    { id: 'side-shave', name: 'side shave', tags: ['punk', 'badgirl'], svg: `
      <path d="M114,162 Q112,144 123,134 Q126,147 123,162 Z" fill="#1a1419" opacity="0.45"/>
      <path d="M286,165 Q292,112 284,98
               Q268,88 200,86 Q182,88 172,96 L169,110 Q182,100 200,100
               Q260,103 276,146 Q275,158 272,165 Z"
            fill="#2a1a30" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M286,165 Q294,240 290,330 Q274,316 270,264 Q268,208 272,165 Z"
            fill="#2a1a30" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M250,128 Q272,112 284,130" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" opacity="0.22"/>
      <path d="M280,190 Q286,240 284,295"  fill="none" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.18"/>
    `},
  ],

  // ── SHIRT ─────────────────────────────────────────────────────────
  // Short sleeve: arm y=345–375. Long sleeve rects: y=345–443.
  // Collar y=308–320. Shirt hem y=426.
  shirt: [
    { id: 'plain-tee', name: 'plain tee', tags: ['normie', 'jock'], svg: `
      <path d="M93,375 L93,345
               Q112,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q288,318 307,345
               L307,375 Q291,386 272,371 L272,426 L128,426 L128,371
               Q109,386 93,375 Z"
            fill="#e8e8e8" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M155,370 Q162,388 162,406" fill="none" stroke="#d0d0d0" stroke-width="1.5"/>
    `},
    { id: 'band-tee', name: 'band tee', tags: ['punk', 'goth', 'badgirl'], svg: `
      <path d="M93,375 L93,345
               Q112,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q288,318 307,345
               L307,375 Q291,386 272,371 L272,426 L128,426 L128,371
               Q109,386 93,375 Z"
            fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <ellipse cx="200" cy="388" rx="22" ry="20" fill="white"/>
      <rect x="190" y="400" width="20" height="12" fill="white"/>
      <ellipse cx="192" cy="385" rx="3.5" ry="4" fill="${LINE}"/>
      <ellipse cx="208" cy="385" rx="3.5" ry="4" fill="${LINE}"/>
      <path d="M198,393 L200,398 L202,393 Z" fill="${LINE}"/>
      <rect x="195" y="401" width="2.5" height="5" fill="${LINE}"/>
      <rect x="200" y="401" width="2.5" height="5" fill="${LINE}"/>
      <rect x="205" y="401" width="2.5" height="5" fill="${LINE}"/>
    `},
    { id: 'hoodie', name: 'hoodie', tags: ['normie', 'nerd', 'punk'], svg: `
      <rect x="91" y="345" width="38" height="98" fill="#7a8a9a" stroke="${LINE}" stroke-width="${SW}" rx="16"/>
      <rect x="271" y="345" width="38" height="98" fill="#7a8a9a" stroke="${LINE}" stroke-width="${SW}" rx="16"/>
      <path d="M93,443 L93,345
               Q112,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q288,318 307,345
               L307,443 Q291,448 272,426 L128,426 Q109,448 93,443 Z"
            fill="#7a8a9a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M128,312 Q108,300 112,248 Q126,222 164,220 Q161,246 163,280 Q152,303 134,314 Z"
            fill="#7a8a9a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M272,312 Q292,300 288,248 Q274,222 236,220 Q239,246 237,280 Q248,303 266,314 Z"
            fill="#7a8a9a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <line x1="196" y1="320" x2="196" y2="380" stroke="${LINE}" stroke-width="1.5"/>
      <line x1="204" y1="320" x2="204" y2="380" stroke="${LINE}" stroke-width="1.5"/>
      <circle cx="196" cy="382" r="3.5" fill="white" stroke="${LINE}" stroke-width="1.5"/>
      <circle cx="204" cy="382" r="3.5" fill="white" stroke="${LINE}" stroke-width="1.5"/>
      <rect x="91" y="426" width="38" height="13" fill="#697a8a" stroke="${LINE}" stroke-width="2" rx="5"/>
      <rect x="271" y="426" width="38" height="13" fill="#697a8a" stroke="${LINE}" stroke-width="2" rx="5"/>
    `},
    { id: 'leather-jacket', name: 'leather jacket', tags: ['punk', 'badgirl', 'goth'], svg: `
      <rect x="87" y="345" width="44" height="98" fill="#2a2024" stroke="${LINE}" stroke-width="${SW}" rx="15"/>
      <rect x="269" y="345" width="44" height="98" fill="#2a2024" stroke="${LINE}" stroke-width="${SW}" rx="15"/>
      <path d="M89,443 L89,345 Q109,314 128,312 L200,336 L272,312
               Q291,314 311,345 L311,443
               Q292,449 272,426 L128,426
               Q108,449 89,443 Z"
            fill="#2a2024" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M200,336 L158,416 L192,428 Z" fill="#1a1419" stroke="${LINE}" stroke-width="2"/>
      <path d="M200,336 L242,416 L208,428 Z" fill="#1a1419" stroke="${LINE}" stroke-width="2"/>
      <line x1="200" y1="336" x2="200" y2="426" stroke="#888" stroke-width="2" stroke-dasharray="3 4"/>
      <circle cx="99"  cy="386" r="3" fill="#c0c0c0" stroke="${LINE}" stroke-width="1"/>
      <circle cx="99"  cy="402" r="3" fill="#c0c0c0" stroke="${LINE}" stroke-width="1"/>
      <circle cx="301" cy="386" r="3" fill="#c0c0c0" stroke="${LINE}" stroke-width="1"/>
      <circle cx="301" cy="402" r="3" fill="#c0c0c0" stroke="${LINE}" stroke-width="1"/>
    `},
    { id: 'varsity', name: 'varsity jacket', tags: ['jock'], svg: `
      <path d="M93,443 L93,345
               Q112,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q288,318 307,345
               L307,443 L128,443 Z"
            fill="#c83a3a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <rect x="93"  y="345" width="36" height="98" fill="white" stroke="${LINE}" stroke-width="${SW}" rx="15"/>
      <rect x="271" y="345" width="36" height="98" fill="white" stroke="${LINE}" stroke-width="${SW}" rx="15"/>
      <rect x="93"  y="426" width="36" height="13" fill="#c83a3a" stroke="${LINE}" stroke-width="2" rx="5"/>
      <rect x="271" y="426" width="36" height="13" fill="#c83a3a" stroke="${LINE}" stroke-width="2" rx="5"/>
      <line x1="200" y1="322" x2="200" y2="426" stroke="white" stroke-width="3"/>
      <text x="200" y="418" text-anchor="middle" font-family="Impact,sans-serif"
            font-size="46" font-weight="900" fill="white" stroke="${LINE}" stroke-width="2">J</text>
    `},
    { id: 'polo', name: 'polo + pen pocket', tags: ['nerd'], svg: `
      <path d="M93,375 L93,345
               Q112,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q288,318 307,345
               L307,375 Q291,386 272,371 L272,426 L128,426 L128,371
               Q109,386 93,375 Z"
            fill="#5b8dd6" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M183,311 L192,340 L200,330 L208,340 L217,311" fill="white" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
      <line x1="200" y1="342" x2="200" y2="376" stroke="${LINE}" stroke-width="1.5"/>
      <circle cx="200" cy="349" r="2.5" fill="white" stroke="${LINE}" stroke-width="1"/>
      <circle cx="200" cy="362" r="2.5" fill="white" stroke="${LINE}" stroke-width="1"/>
      <rect x="218" y="372" width="28" height="24" fill="none" stroke="${LINE}" stroke-width="2"/>
      <rect x="223" y="369" width="3" height="12" fill="#1a1a1a"/>
      <rect x="228" y="369" width="3" height="12" fill="#cc3030"/>
      <rect x="233" y="369" width="3" height="12" fill="#3030cc"/>
    `},
    { id: 'frilly-dress', name: 'frilly dress', tags: ['goodgirl', 'normie'], svg: `
      <ellipse cx="104" cy="358" rx="21" ry="17" fill="#ffafcc" stroke="${LINE}" stroke-width="${SW}"/>
      <ellipse cx="296" cy="358" rx="21" ry="17" fill="#ffafcc" stroke="${LINE}" stroke-width="${SW}"/>
      <path d="M106,374 L106,345
               Q120,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q280,318 294,345
               L294,374 Q278,384 272,370 L272,426 L128,426 L128,370
               Q122,384 106,374 Z"
            fill="#ffafcc" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M183,320 L200,313 L217,320 L208,332 L200,322 L192,332 Z"
            fill="#ff6f91" stroke="${LINE}" stroke-width="2"/>
      <circle cx="200" cy="322" r="4.5" fill="#ff6f91" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'black-dress', name: 'goth dress', tags: ['goth', 'badgirl'], svg: `
      <path d="M128,426 L128,336
               Q134,316 150,308 Q168,303 183,308 Q188,320 200,320 Q212,320 217,308
               Q232,303 250,308 Q266,316 272,336
               L272,426 Z"
            fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M166,334 Q200,348 234,334 Q224,348 200,352 Q176,348 166,334 Z"
            fill="#3a2a3a" stroke="${LINE}" stroke-width="1.5"/>
    `},
    { id: 'angel-robe', name: 'angelic robe', tags: ['angelic', 'goodgirl'], svg: `
      <path d="M90,416 L90,345
               Q108,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q292,318 310,345
               L310,416 Q300,426 272,414 L272,426 L128,426 L128,414
               Q100,426 90,416 Z"
            fill="#fff8dc" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M90,403 L90,416 Q100,426 128,414 L128,401 Q100,412 90,403 Z" fill="#f5d670" stroke="${LINE}" stroke-width="1.5"/>
      <path d="M310,403 L310,416 Q300,426 272,414 L272,401 Q300,412 310,403 Z" fill="#f5d670" stroke="${LINE}" stroke-width="1.5"/>
      <circle cx="200" cy="392" r="14" fill="none" stroke="#f5d670" stroke-width="3"/>
    `},
    { id: 'lab-coat', name: 'lab coat', tags: ['nerd'], svg: `
      <rect x="91" y="345" width="38" height="98" fill="white" stroke="${LINE}" stroke-width="${SW}" rx="15"/>
      <rect x="271" y="345" width="38" height="98" fill="white" stroke="${LINE}" stroke-width="${SW}" rx="15"/>
      <path d="M93,443 L93,345
               Q112,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q288,318 307,345
               L307,443 L128,443 Z"
            fill="white" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M200,320 L176,426 M200,320 L224,426" stroke="${LINE}" stroke-width="2"/>
      <circle cx="188" cy="364" r="2.5" fill="${LINE}"/>
      <circle cx="188" cy="382" r="2.5" fill="${LINE}"/>
      <circle cx="188" cy="400" r="2.5" fill="${LINE}"/>
      <rect x="220" y="368" width="28" height="22" fill="none" stroke="${LINE}" stroke-width="2"/>
      <line x1="224" y1="375" x2="244" y2="375" stroke="${LINE}" stroke-width="1"/>
      <line x1="224" y1="381" x2="244" y2="381" stroke="${LINE}" stroke-width="1"/>
    `},
    { id: 'crop-top', name: 'crop top', tags: ['badgirl', 'jock'], svg: `
      <path d="M104,375 L104,345
               Q118,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q282,318 296,345
               L296,375 Q283,385 272,371 L272,410 L128,410 L128,371
               Q117,385 104,375 Z"
            fill="#ff6f91" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
    `},
    { id: 'overalls', name: 'overalls', tags: ['normie', 'goodgirl'], svg: `
      <path d="M93,375 L93,345
               Q112,318 128,312 Q150,306 183,308 Q188,320 200,320 Q212,320 217,308
               Q250,306 272,312 Q288,318 307,345
               L307,375 Q291,386 272,371 L272,426 L128,426 L128,371
               Q109,386 93,375 Z"
            fill="white" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <rect x="154" y="308" width="92" height="62" fill="#5a7eb0" stroke="${LINE}" stroke-width="${SW}" rx="4"/>
      <rect x="162" y="308" width="10" height="10" fill="#c0c050" stroke="${LINE}" stroke-width="1.5"/>
      <rect x="228" y="308" width="10" height="10" fill="#c0c050" stroke="${LINE}" stroke-width="1.5"/>
      <rect x="178" y="338" width="44" height="22" fill="none" stroke="${LINE}" stroke-width="2"/>
    `},
  ],

  // ── PANTS ─────────────────────────────────────────────────────────
  // Waistband y=426–452. Left leg x=133–184, right x=216–267, y=452–557.
  pants: [
    { id: 'jeans', name: 'jeans', tags: ['normie', 'jock', 'nerd'], svg: `
      <rect x="128" y="426" width="144" height="28" fill="#3a5a8c" stroke="${LINE}" stroke-width="${SW}" rx="4"/>
      <rect x="128" y="426" width="144" height="12" fill="#2a4a7c" stroke="${LINE}" stroke-width="${SW}" rx="4"/>
      <rect x="133" y="452" width="52" height="105" fill="#3a5a8c" stroke="${LINE}" stroke-width="${SW}" rx="10"/>
      <rect x="215" y="452" width="52" height="105" fill="#3a5a8c" stroke="${LINE}" stroke-width="${SW}" rx="10"/>
      <rect x="188" y="429" width="24" height="7"  fill="#c0a050" stroke="${LINE}" stroke-width="1.5" rx="2"/>
      <line x1="159" y1="454" x2="159" y2="555" stroke="${LINE}" stroke-width="1" opacity="0.3"/>
      <line x1="241" y1="454" x2="241" y2="555" stroke="${LINE}" stroke-width="1" opacity="0.3"/>
    `},
    { id: 'black-pants', name: 'black pants', tags: ['goth', 'punk', 'badgirl'], svg: `
      <rect x="128" y="426" width="144" height="28" fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" rx="4"/>
      <rect x="128" y="426" width="144" height="12" fill="#0f0c10" stroke="${LINE}" stroke-width="${SW}" rx="4"/>
      <rect x="133" y="452" width="52" height="105" fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" rx="10"/>
      <rect x="215" y="452" width="52" height="105" fill="#1a1419" stroke="${LINE}" stroke-width="${SW}" rx="10"/>
      <line x1="159" y1="454" x2="159" y2="555" stroke="#555" stroke-width="1"/>
      <line x1="241" y1="454" x2="241" y2="555" stroke="#555" stroke-width="1"/>
    `},
    { id: 'shorts', name: 'shorts', tags: ['jock', 'normie', 'badgirl'], svg: `
      <rect x="128" y="426" width="144" height="12" fill="#2a4a7c" stroke="${LINE}" stroke-width="${SW}" rx="4"/>
      <rect x="133" y="436" width="52" height="63" fill="#3a5a8c" stroke="${LINE}" stroke-width="${SW}" rx="8"/>
      <rect x="215" y="436" width="52" height="63" fill="#3a5a8c" stroke="${LINE}" stroke-width="${SW}" rx="8"/>
    `},
    { id: 'skirt', name: 'skirt', tags: ['goodgirl', 'normie', 'anime'], svg: `
      <rect x="122" y="426" width="156" height="12" fill="#d4549a" stroke="${LINE}" stroke-width="${SW}" rx="3"/>
      <path d="M112,436 L288,436 Q316,454 310,502 L90,502 Q84,454 112,436 Z"
            fill="#ffafcc" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M112,492 Q120,478 128,492 Q136,478 144,492 Q152,478 160,492 Q168,478 176,492
               Q184,478 192,492 Q200,478 208,492 Q216,478 224,492 Q232,478 240,492
               Q248,478 256,492 Q264,478 272,492 Q280,478 288,492"
            fill="none" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'mini-skirt', name: 'mini skirt', tags: ['badgirl', 'anime'], svg: `
      <rect x="122" y="426" width="156" height="10" fill="#845ec2" stroke="${LINE}" stroke-width="${SW}" rx="3"/>
      <path d="M116,434 L284,434 Q295,446 290,480 L110,480 Q105,446 116,434 Z"
            fill="#b07de0" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
    `},
    { id: 'plaid-skirt', name: 'plaid skirt', tags: ['goodgirl', 'normie', 'nerd'], svg: `
      <rect x="122" y="426" width="156" height="11" fill="#8c3a3a" stroke="${LINE}" stroke-width="${SW}" rx="3"/>
      <path d="M112,435 L288,435 Q312,453 305,504 L95,504 Q88,453 112,435 Z"
            fill="#c85a5a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <g stroke="white" stroke-width="2" opacity="0.6">
        <line x1="148" y1="435" x2="138" y2="504"/>
        <line x1="174" y1="435" x2="164" y2="504"/>
        <line x1="200" y1="435" x2="200" y2="504"/>
        <line x1="226" y1="435" x2="236" y2="504"/>
        <line x1="252" y1="435" x2="262" y2="504"/>
      </g>
      <g stroke="white" stroke-width="1" opacity="0.4">
        <line x1="112" y1="452" x2="288" y2="452"/>
        <line x1="108" y1="469" x2="292" y2="469"/>
        <line x1="104" y1="486" x2="296" y2="486"/>
      </g>
    `},
    { id: 'robe-bottom', name: 'robe / long skirt', tags: ['goth', 'angelic'], svg: `
      <path d="M122,432 L278,432 L305,557 L95,557 Z"
            fill="#3a2a4a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <rect x="122" y="426" width="156" height="11" fill="#2a1a3a" stroke="${LINE}" stroke-width="${SW}" rx="3"/>
      <path d="M110,476 L290,476 M108,506 L292,506 M106,536 L294,536"
            stroke="#5a3a6a" stroke-width="1.5" fill="none"/>
    `},
    { id: 'gym-shorts', name: 'gym shorts', tags: ['jock'], svg: `
      <rect x="128" y="426" width="144" height="11" fill="#1a3a6c" stroke="${LINE}" stroke-width="${SW}" rx="3"/>
      <rect x="130" y="435" width="140" height="59" fill="#1a4a8c" stroke="${LINE}" stroke-width="${SW}" rx="6"/>
      <line x1="200" y1="437" x2="200" y2="492" stroke="white" stroke-width="2.5"/>
      <path d="M130,492 Q134,498 142,494 L148,437" stroke="${LINE}" stroke-width="1" fill="none"/>
      <path d="M270,492 Q266,498 258,494 L252,437" stroke="${LINE}" stroke-width="1" fill="none"/>
    `},
  ],

  // ── SHOES ─────────────────────────────────────────────────────────
  // Feet at y=555–572. Left x=133–184, right x=216–267.
  shoes: [
    { id: 'sneakers', name: 'sneakers', tags: ['normie', 'jock', 'nerd'], svg: `
      <path d="M131,565 Q131,573 159,573 Q187,573 187,565 Z" fill="white" stroke="${LINE}" stroke-width="2"/>
      <path d="M213,565 Q213,573 241,573 Q269,573 269,565 Z" fill="white" stroke="${LINE}" stroke-width="2"/>
      <path d="M133,555 L185,555 Q188,565 185,568 L133,568 Q130,565 133,555 Z" fill="#ff6f91" stroke="${LINE}" stroke-width="2"/>
      <path d="M215,555 L267,555 Q270,565 267,568 L215,568 Q212,565 215,555 Z" fill="#ff6f91" stroke="${LINE}" stroke-width="2"/>
      <line x1="143" y1="558" x2="175" y2="558" stroke="white" stroke-width="2"/>
      <line x1="225" y1="558" x2="257" y2="558" stroke="white" stroke-width="2"/>
    `},
    { id: 'boots', name: 'boots', tags: ['goth', 'punk', 'badgirl'], svg: `
      <rect x="131" y="490" width="52" height="67" fill="#1a1419" stroke="${LINE}" stroke-width="2" rx="6"/>
      <rect x="213" y="490" width="52" height="67" fill="#1a1419" stroke="${LINE}" stroke-width="2" rx="6"/>
      <rect x="131" y="490" width="52" height="13" fill="#2a2028" stroke="${LINE}" stroke-width="2" rx="4"/>
      <rect x="213" y="490" width="52" height="13" fill="#2a2028" stroke="${LINE}" stroke-width="2" rx="4"/>
      <line x1="157" y1="505" x2="157" y2="555" stroke="#444" stroke-width="1.5"/>
      <line x1="239" y1="505" x2="239" y2="555" stroke="#444" stroke-width="1.5"/>
    `},
    { id: 'mary-janes', name: 'mary janes', tags: ['goodgirl', 'normie', 'anime'], svg: `
      <path d="M131,562 Q131,572 159,572 Q187,572 187,562 Z" fill="#2a2a8c" stroke="${LINE}" stroke-width="2"/>
      <path d="M213,562 Q213,572 241,572 Q269,572 269,562 Z" fill="#2a2a8c" stroke="${LINE}" stroke-width="2"/>
      <path d="M133,555 L185,555 L185,564 L133,564 Z" fill="#2a2a8c" stroke="${LINE}" stroke-width="2"/>
      <path d="M215,555 L267,555 L267,564 L215,564 Z" fill="#2a2a8c" stroke="${LINE}" stroke-width="2"/>
      <path d="M145,554 Q159,546 173,554" fill="none" stroke="${LINE}" stroke-width="2"/>
      <path d="M227,554 Q241,546 255,554" fill="none" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'heels', name: 'heels', tags: ['badgirl', 'goodgirl'], svg: `
      <path d="M140,562 Q136,572 152,572 L182,572 L182,562 Z" fill="#d8567c" stroke="${LINE}" stroke-width="2"/>
      <path d="M222,562 Q218,572 234,572 L264,572 L264,562 Z" fill="#d8567c" stroke="${LINE}" stroke-width="2"/>
      <rect x="133" y="558" width="6" height="11" fill="#d8567c" stroke="${LINE}" stroke-width="1.5" rx="2"/>
      <rect x="261" y="558" width="6" height="11" fill="#d8567c" stroke="${LINE}" stroke-width="1.5" rx="2"/>
    `},
    { id: 'bare', name: 'bare feet', tags: ['angelic', 'normie'], svg: ({ skin }) => `
      <path d="M133,556 Q133,568 147,570 Q159,572 171,570 Q183,568 185,556"
            fill="${skin}" stroke="${LINE}" stroke-width="2"/>
      <path d="M215,556 Q215,568 229,570 Q241,572 253,570 Q265,568 267,556"
            fill="${skin}" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'platform', name: 'platform boots', tags: ['punk', 'goth'], svg: `
      <rect x="128" y="497" width="56" height="56" fill="#1a1419" stroke="${LINE}" stroke-width="2" rx="6"/>
      <rect x="210" y="497" width="56" height="56" fill="#1a1419" stroke="${LINE}" stroke-width="2" rx="6"/>
      <rect x="125" y="547" width="62" height="11" fill="#845ec2" stroke="${LINE}" stroke-width="2" rx="3"/>
      <rect x="207" y="547" width="62" height="11" fill="#845ec2" stroke="${LINE}" stroke-width="2" rx="3"/>
      <line x1="156" y1="510" x2="156" y2="545" stroke="#444" stroke-width="1.5"/>
      <line x1="238" y1="510" x2="238" y2="545" stroke="#444" stroke-width="1.5"/>
    `},
  ],

  // ── ACCESSORIES ───────────────────────────────────────────────────
  accessories: [
    { id: 'none', name: 'none', svg: `` },
    { id: 'glasses-round', name: 'round glasses', tags: ['nerd', 'normie'], svg: `
      <circle cx="165" cy="222" r="21" fill="white" fill-opacity="0.2" stroke="${LINE}" stroke-width="3"/>
      <circle cx="235" cy="222" r="21" fill="white" fill-opacity="0.2" stroke="${LINE}" stroke-width="3"/>
      <line x1="186" y1="222" x2="214" y2="222" stroke="${LINE}" stroke-width="3"/>
    `},
    { id: 'glasses-taped', name: 'taped glasses', tags: ['nerd'], svg: `
      <rect x="143" y="206" width="44" height="32" fill="white" fill-opacity="0.2" stroke="${LINE}" stroke-width="3" rx="3"/>
      <rect x="213" y="206" width="44" height="32" fill="white" fill-opacity="0.2" stroke="${LINE}" stroke-width="3" rx="3"/>
      <line x1="187" y1="222" x2="213" y2="222" stroke="${LINE}" stroke-width="3"/>
      <rect x="196" y="218" width="8" height="8" fill="#f0e0a0" stroke="${LINE}" stroke-width="1.5"/>
    `},
    { id: 'sunglasses', name: 'sunglasses', tags: ['badgirl', 'punk', 'jock'], svg: `
      <rect x="140" y="208" width="48" height="22" fill="${LINE}" rx="8"/>
      <rect x="212" y="208" width="48" height="22" fill="${LINE}" rx="8"/>
      <line x1="188" y1="219" x2="212" y2="219" stroke="${LINE}" stroke-width="3"/>
      <line x1="148" y1="214" x2="170" y2="222" stroke="white" stroke-width="2.5"/>
      <line x1="220" y1="214" x2="242" y2="222" stroke="white" stroke-width="2.5"/>
    `},
    { id: 'halo', name: 'halo', tags: ['angelic'], svg: `
      <ellipse cx="200" cy="96" rx="62" ry="13" fill="#f5d670" opacity="0.35"/>
      <ellipse cx="200" cy="96" rx="62" ry="13" fill="none" stroke="#f5d670" stroke-width="5"/>
      <ellipse cx="200" cy="96" rx="62" ry="13" fill="none" stroke="${LINE}" stroke-width="1.5"/>
    `},
    { id: 'horns', name: 'devil horns', tags: ['badgirl', 'goth', 'punk'], svg: `
      <path d="M148,148 Q150,106 168,122 Q176,141 162,150 Z" fill="#c83a3a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M252,148 Q250,106 232,122 Q224,141 238,150 Z" fill="#c83a3a" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
    `},
    { id: 'headphones', name: 'headphones', tags: ['nerd', 'normie'], svg: `
      <path d="M121,198 Q116,124 200,116 Q284,124 279,198" fill="none" stroke="${LINE}" stroke-width="6" stroke-linecap="round"/>
      <rect x="105" y="186" width="26" height="48" fill="#ff6f91" stroke="${LINE}" stroke-width="${SW}" rx="7"/>
      <rect x="269" y="186" width="26" height="48" fill="#ff6f91" stroke="${LINE}" stroke-width="${SW}" rx="7"/>
      <circle cx="118" cy="210" r="6" fill="${LINE}"/>
      <circle cx="282" cy="210" r="6" fill="${LINE}"/>
    `},
    { id: 'cat-ears', name: 'cat ears', tags: ['anime', 'goodgirl', 'badgirl'], svg: ({ skin }) => `
      <path d="M136,158 L120,94  L165,140 Z" fill="${skin}" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M264,158 L280,94  L235,140 Z" fill="${skin}" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M140,150 L128,112 L158,137 Z" fill="#ffafcc" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M260,150 L272,112 L242,137 Z" fill="#ffafcc" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>
    `},
    { id: 'earrings', name: 'earrings', tags: ['badgirl', 'goodgirl', 'goth'], svg: `
      <circle cx="107" cy="228" r="5.5" fill="#f5d670" stroke="${LINE}" stroke-width="2"/>
      <circle cx="293" cy="228" r="5.5" fill="#f5d670" stroke="${LINE}" stroke-width="2"/>
    `},
    { id: 'mask', name: 'face mask', tags: ['nerd', 'normie'], svg: `
      <path d="M150,248 Q150,290 200,295 Q250,290 250,248 L260,243 L240,235
               Q220,238 200,238 Q180,238 160,235 L140,243 Z"
            fill="#9bc4ff" stroke="${LINE}" stroke-width="${SW}" stroke-linejoin="round"/>
      <path d="M150,255 L250,255 M150,270 L250,270" stroke="${LINE}" stroke-width="1" opacity="0.4"/>
    `},
    { id: 'tear', name: 'tear drop', tags: ['goth', 'anime'], svg: `
      <path d="M173,240 Q170,256 178,259 Q184,256 178,240 Z" fill="#5b9dd6" stroke="${LINE}" stroke-width="1.5"/>
    `},
  ],

  // ── BACKGROUND ────────────────────────────────────────────────────
  background: [
    { id: 'plain', name: 'plain', svg: `` },
    { id: 'stars', name: 'stars', tags: ['angelic', 'goodgirl'], svg: `
      <rect width="400" height="600" fill="#f0e6ff"/>
      ${STAR(60, 80, 8, '#f5d670')}
      ${STAR(340, 60, 6, '#f5d670')}
      ${STAR(50, 450, 5, '#f5d670')}
      ${STAR(360, 500, 7, '#f5d670')}
      ${STAR(80, 260, 4, '#f5d670')}
      ${STAR(330, 300, 5, '#f5d670')}
      ${STAR(30, 130, 3, '#ff6f91')}
      ${STAR(370, 180, 4, '#ff6f91')}
    `},
    { id: 'sunset', name: 'sunset', tags: ['anime', 'normie', 'goodgirl'], svg: `
      <defs>
        <linearGradient id="bg-sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ff9a8b"/>
          <stop offset="0.5" stop-color="#ff6a88"/>
          <stop offset="1" stop-color="#fcb045"/>
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#bg-sunset)"/>
      <circle cx="200" cy="400" r="80" fill="#ffe4a0" opacity="0.6"/>
    `},
    { id: 'hearts', name: 'hearts', tags: ['goodgirl', 'badgirl'], svg: `
      <rect width="400" height="600" fill="#ffe6f0"/>
      <g fill="#ff6f91" stroke="${LINE}" stroke-width="1.5">
        <path d="M50,80 Q35,55 60,55 Q75,55 75,72 Q75,55 90,55 Q115,55 100,80 L75,108 Z"/>
        <path d="M310,80 Q295,55 320,55 Q335,55 335,72 Q335,55 350,55 Q375,55 360,80 L335,108 Z"/>
        <path d="M55,500 Q40,475 65,475 Q80,475 80,492 Q80,475 95,475 Q120,475 105,500 L80,528 Z"/>
        <path d="M310,520 Q295,495 320,495 Q335,495 335,512 Q335,495 350,495 Q375,495 360,520 L335,548 Z"/>
      </g>
    `},
    { id: 'storm', name: 'lightning', tags: ['punk', 'goth'], svg: `
      <rect width="400" height="600" fill="#3a2a4a"/>
      <path d="M70,40 L90,210 L60,210 L100,440" fill="none" stroke="#ffd700" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M340,80 L320,240 L350,240 L310,480" fill="none" stroke="#ffd700" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    `},
    { id: 'sakura', name: 'sakura', tags: ['anime', 'goodgirl'], svg: `
      <rect width="400" height="600" fill="#fff0f5"/>
      <g fill="#ffafcc" stroke="${LINE}" stroke-width="0.5">
        <circle cx="50"  cy="80"  r="6"/><circle cx="62"  cy="75"  r="5"/><circle cx="55"  cy="87"  r="5"/>
        <circle cx="340" cy="60"  r="6"/><circle cx="352" cy="55"  r="5"/><circle cx="346" cy="67"  r="5"/>
        <circle cx="70"  cy="460" r="5"/><circle cx="80"  cy="455" r="4"/>
        <circle cx="350" cy="500" r="6"/><circle cx="340" cy="495" r="5"/>
      </g>
    `},
    { id: 'grid', name: 'grid', tags: ['nerd'], svg: `
      <rect width="400" height="600" fill="#e8f0d8"/>
      <g stroke="${LINE}" stroke-width="0.5" opacity="0.4">
        <path d="M0,40 L400,40 M0,80 L400,80 M0,120 L400,120 M0,160 L400,160 M0,200 L400,200 M0,240 L400,240 M0,280 L400,280 M0,320 L400,320 M0,360 L400,360 M0,400 L400,400 M0,440 L400,440 M0,480 L400,480 M0,520 L400,520 M0,560 L400,560"/>
        <path d="M40,0 L40,600 M80,0 L80,600 M120,0 L120,600 M160,0 L160,600 M200,0 L200,600 M240,0 L240,600 M280,0 L280,600 M320,0 L320,600 M360,0 L360,600"/>
      </g>
    `},
    { id: 'pitch', name: 'sports field', tags: ['jock'], svg: `
      <rect width="400" height="600" fill="#6aa84f"/>
      <line x1="0" y1="300" x2="400" y2="300" stroke="white" stroke-width="3"/>
      <circle cx="200" cy="300" r="50" fill="none" stroke="white" stroke-width="3"/>
      <circle cx="200" cy="300" r="3" fill="white"/>
    `},
    { id: 'galaxy', name: 'galaxy', tags: ['goth', 'anime'], svg: `
      <defs>
        <radialGradient id="bg-galaxy" cx="50%" cy="50%">
          <stop offset="0" stop-color="#6a0dad"/>
          <stop offset="0.6" stop-color="#2a1060"/>
          <stop offset="1" stop-color="#080618"/>
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill="url(#bg-galaxy)"/>
      <circle cx="80"  cy="100" r="1.5" fill="white" opacity="0.9"/>
      <circle cx="140" cy="55"  r="1"   fill="white" opacity="0.7"/>
      <circle cx="320" cy="75"  r="2"   fill="white" opacity="0.9"/>
      <circle cx="355" cy="150" r="1"   fill="white" opacity="0.6"/>
      <circle cx="45"  cy="310" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="375" cy="350" r="1"   fill="white" opacity="0.6"/>
      <circle cx="28"  cy="500" r="2"   fill="white" opacity="0.7"/>
      <circle cx="382" cy="480" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="100" cy="550" r="1"   fill="#c0b0ff" opacity="0.8"/>
      <circle cx="300" cy="520" r="1.5" fill="#ffd0ff" opacity="0.7"/>
      <ellipse cx="200" cy="300" rx="130" ry="38" fill="#9060ff" opacity="0.10" transform="rotate(-15 200 300)"/>
    `},
    { id: 'rainbow', name: 'rainbow', svg: `
      <defs>
        <linearGradient id="bg-rainbow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"    stop-color="#ff6b6b"/>
          <stop offset="0.18" stop-color="#ffaa00"/>
          <stop offset="0.36" stop-color="#ffd700"/>
          <stop offset="0.54" stop-color="#7ed57e"/>
          <stop offset="0.72" stop-color="#5bc8f5"/>
          <stop offset="1"    stop-color="#cc88ee"/>
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#bg-rainbow)"/>
    `},
    { id: 'vaporwave', name: 'vaporwave', tags: ['badgirl', 'anime'], svg: `
      <defs>
        <linearGradient id="bg-vapor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"   stop-color="#1a0030"/>
          <stop offset="0.5" stop-color="#7b00a0"/>
          <stop offset="1"   stop-color="#ff6ec7"/>
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#bg-vapor)"/>
      <line x1="0" y1="420" x2="400" y2="420" stroke="#00ffff" stroke-width="1.5" opacity="0.6"/>
      <line x1="0" y1="445" x2="400" y2="445" stroke="#00ffff" stroke-width="1"   opacity="0.45"/>
      <line x1="0" y1="466" x2="400" y2="466" stroke="#00ffff" stroke-width="1"   opacity="0.35"/>
      <line x1="0" y1="484" x2="400" y2="484" stroke="#00ffff" stroke-width="0.8" opacity="0.28"/>
      <line x1="0" y1="500" x2="400" y2="500" stroke="#00ffff" stroke-width="0.8" opacity="0.22"/>
      <line x1="0" y1="515" x2="400" y2="515" stroke="#00ffff" stroke-width="0.7" opacity="0.18"/>
      <line x1="0" y1="528" x2="400" y2="528" stroke="#00ffff" stroke-width="0.7" opacity="0.14"/>
      <circle cx="200" cy="230" r="75" fill="#ff69b4" opacity="0.20"/>
      <circle cx="200" cy="230" r="75" fill="none" stroke="#ff69b4" stroke-width="2.5" opacity="0.55"/>
      <text x="200" y="66" text-anchor="middle" font-family="serif" font-size="30"
            fill="#00ffff" opacity="0.55" letter-spacing="10">夢</text>
    `},
    { id: 'polka', name: 'polka dots', tags: ['goodgirl', 'normie'], svg: `
      <rect width="400" height="600" fill="#fff0f8"/>
      <g fill="#ff6f91" opacity="0.45">
        <circle cx="40"  cy="40"  r="12"/><circle cx="120" cy="40"  r="12"/>
        <circle cx="200" cy="40"  r="12"/><circle cx="280" cy="40"  r="12"/><circle cx="360" cy="40"  r="12"/>
        <circle cx="80"  cy="120" r="12"/><circle cx="160" cy="120" r="12"/>
        <circle cx="240" cy="120" r="12"/><circle cx="320" cy="120" r="12"/>
        <circle cx="40"  cy="200" r="12"/><circle cx="120" cy="200" r="12"/>
        <circle cx="200" cy="200" r="12"/><circle cx="280" cy="200" r="12"/><circle cx="360" cy="200" r="12"/>
        <circle cx="80"  cy="280" r="12"/><circle cx="160" cy="280" r="12"/>
        <circle cx="240" cy="280" r="12"/><circle cx="320" cy="280" r="12"/>
        <circle cx="40"  cy="360" r="12"/><circle cx="120" cy="360" r="12"/>
        <circle cx="200" cy="360" r="12"/><circle cx="280" cy="360" r="12"/><circle cx="360" cy="360" r="12"/>
        <circle cx="80"  cy="440" r="12"/><circle cx="160" cy="440" r="12"/>
        <circle cx="240" cy="440" r="12"/><circle cx="320" cy="440" r="12"/>
        <circle cx="40"  cy="520" r="12"/><circle cx="120" cy="520" r="12"/>
        <circle cx="200" cy="520" r="12"/><circle cx="280" cy="520" r="12"/><circle cx="360" cy="520" r="12"/>
      </g>
    `},
    { id: 'city', name: 'city night', tags: ['goth', 'punk', 'badgirl'], svg: `
      <rect width="400" height="600" fill="#080e1c"/>
      <g fill="#14213a">
        <rect x="18"  y="300" width="42" height="300"/>
        <rect x="68"  y="340" width="32" height="260"/>
        <rect x="108" y="258" width="52" height="342"/>
        <rect x="168" y="318" width="36" height="282"/>
        <rect x="212" y="276" width="48" height="324"/>
        <rect x="268" y="348" width="32" height="252"/>
        <rect x="308" y="286" width="42" height="314"/>
        <rect x="358" y="328" width="42" height="272"/>
      </g>
      <g fill="#ffd060" opacity="0.55">
        <rect x="24"  y="312" width="5" height="4"/><rect x="35"  y="312" width="5" height="4"/>
        <rect x="24"  y="327" width="5" height="4"/><rect x="35"  y="327" width="5" height="4"/>
        <rect x="114" y="270" width="5" height="4"/><rect x="126" y="270" width="5" height="4"/>
        <rect x="114" y="285" width="5" height="4"/><rect x="126" y="285" width="5" height="4"/>
        <rect x="218" y="288" width="5" height="4"/><rect x="230" y="288" width="5" height="4"/>
        <rect x="314" y="298" width="5" height="4"/><rect x="326" y="298" width="5" height="4"/>
      </g>
      <circle cx="55"  cy="140" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="200" cy="78"  r="2"   fill="white" opacity="0.7"/>
      <circle cx="338" cy="118" r="1.5" fill="white" opacity="0.5"/>
      <circle cx="98"  cy="205" r="1"   fill="white" opacity="0.6"/>
      <circle cx="298" cy="178" r="1"   fill="white" opacity="0.6"/>
    `},
  ],
};

// ─────── rendering helpers (used by renderAvatarFull / renderPartPreview) ───────
function _renderPart(part, ctx) {
  if (!part) return '';
  return typeof part.svg === 'function' ? part.svg(ctx) : part.svg;
}
function _lookup(cat, id) { return PARTS[cat]?.find(p => p.id === id); }
function _skin(avatar) { return (SKIN_TONES.find(s => s.id === avatar.skin) || SKIN_TONES[1]).color; }

function _avatarContent(avatar) {
  const skin = _skin(avatar);
  const ctx  = { skin };
  const get  = (cat) => _renderPart(_lookup(cat, avatar.parts[cat]), ctx);
  const accs = Array.isArray(avatar.parts.accessories)
    ? avatar.parts.accessories
    : (avatar.parts.accessories ? [avatar.parts.accessories] : []);
  return `
    ${get('background')}
    ${BODY(skin)}
    ${get('shirt')}${get('pants')}${get('shoes')}
    ${SKULL(skin)}
    ${get('mouth')}${get('brows')}${get('eyes')}${get('hair')}
    ${accs.map(id => _renderPart(_lookup('accessories', id), ctx)).join('')}
  `;
}

const _PREVIEW_BOX = {
  eyes: '90 165 220 130', brows: '90 160 220 120', mouth: '120 220 160 90',
  hair: '40 50 320 280',  shirt: '40 280 320 230',  pants: '80 390 240 240',
  shoes: '80 450 240 170', accessories: '50 90 300 280', background: '0 0 400 600',
};

export function renderAvatarFull(avatar) {
  return `<svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">${_avatarContent(avatar)}</svg>`;
}

export function renderPartPreview(avatar, category, partId) {
  const skin = _skin(avatar);
  const ctx  = { skin };
  const part = PARTS[category]?.find(p => p.id === partId);
  const ghost = category === 'background' ? '' : `<g opacity="0.18">${BODY(skin)}${SKULL(skin)}</g>`;
  const vb    = _PREVIEW_BOX[category] || '0 0 400 600';
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">${ghost}${part ? _renderPart(part, ctx) : ''}</svg>`;
}
