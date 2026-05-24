import { readFileSync, writeFileSync } from 'fs';
import { readdirSync } from 'fs';

const CDN_CORE = `'https://cdn.jsdelivr.net/npm/@dicebear/core@9/+esm'`;
const CDN_COLL = `'https://cdn.jsdelivr.net/npm/@dicebear/collection@9/+esm'`;
const VENDOR   = `'./vendor/dicebear.js'`;

const files = readdirSync('.').filter(f => f.startsWith('parts-') && f.endsWith('.js') && f !== 'parts.js' && f !== 'parts-geometric.js');

for (const file of files) {
  let src = readFileSync(file, 'utf8');

  // Extract the style name being imported from collection
  const m = src.match(/const\s*\{\s*(\w+)\s*\}\s*=\s*await import\(.*?@dicebear\/collection/);
  if (!m) { console.log(`skip ${file} (no collection import)`); continue; }
  const style = m[1];

  // Remove the core import line entirely
  src = src.replace(/^const\s*\{\s*createAvatar\s*\}\s*=\s*await import\(.*?@dicebear\/core.*?\);\n/m, '');

  // Replace collection import with combined vendor import
  src = src.replace(
    /const\s*\{\s*\w+\s*\}\s*=\s*await import\(.*?@dicebear\/collection.*?\);/,
    `const { createAvatar, ${style} } = await import(${VENDOR});`,
  );

  writeFileSync(file, src);
  console.log(`✓ ${file}  →  { createAvatar, ${style} }`);
}
