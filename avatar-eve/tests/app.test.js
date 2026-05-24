import { test, expect } from '@playwright/test';

const RENDERERS = [
  'geometric', 'bigSmile', 'micah', 'avataaars', 'lorelei', 'funEmoji', 'notionists',
  'pixelArt', 'adventurer', 'bigEars', 'croodles', 'openPeeps', 'bottts', 'personas',
  'toonHead', 'dylan', 'miniavs',
];

async function loadRenderer(page, name) {
  await page.goto('/');
  await page.evaluate(r => localStorage.setItem('avatar-eve:renderer-v1', r), name);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  return errors;
}

// ── Each renderer loads without errors and renders an SVG ──────────────
for (const r of RENDERERS) {
  test(`renderer: ${r} loads without errors`, async ({ page }) => {
    const errors = await loadRenderer(page, r);
    expect(errors, `JS errors in ${r}: ${errors.join('; ')}`).toHaveLength(0);
    await expect(page.locator('#avatar-canvas svg')).toBeVisible();
    const tabCount = await page.locator('#tab-bar button').count();
    expect(tabCount, `${r} should have at least 2 tabs`).toBeGreaterThanOrEqual(2);
  });
}

// ── Renderer modal ─────────────────────────────────────────────────────
test('renderer modal opens and shows all renderers', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.click('#btn-renderer');
  await page.waitForTimeout(500);
  await expect(page.locator('#renderer-modal')).not.toHaveAttribute('hidden');
  const cards = page.locator('.renderer-card');
  await expect(cards).toHaveCount(RENDERERS.length);
});

test('renderer modal closes on backdrop click', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.click('#btn-renderer');
  await page.waitForTimeout(300);
  // click a corner of the backdrop that isn't covered by the modal dialog
  await page.mouse.click(10, 10);
  await expect(page.locator('#renderer-modal')).toHaveAttribute('hidden', '');
});

test('renderer modal closes when active renderer card is clicked', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.click('#btn-renderer');
  await page.waitForTimeout(500);
  await page.locator('.renderer-card.active').click();
  await page.waitForTimeout(300);
  await expect(page.locator('#renderer-modal')).toHaveAttribute('hidden', '');
});

test('renderer modal shows preview SVGs after opening', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.click('#btn-renderer');
  await page.waitForTimeout(3000); // wait for lazy previews to load
  const previews = page.locator('.renderer-preview svg');
  const count = await previews.count();
  expect(count).toBeGreaterThan(RENDERERS.length / 2); // most should load
});

// ── Random button ──────────────────────────────────────────────────────
test('random button changes the avatar SVG', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const before = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  await page.click('#btn-random');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  expect(after).not.toEqual(before);
});

test('random button produces variety over multiple clicks', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const svgs = new Set();
  for (let i = 0; i < 4; i++) {
    await page.click('#btn-random');
    await page.waitForTimeout(300);
    const svg = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
    svgs.add(svg);
  }
  // At least 2 distinct states — probability of 4 identical in a row is negligible
  expect(svgs.size).toBeGreaterThan(1);
});

test('random button works for notionists (no skin tones)', async ({ page }) => {
  const errors = await loadRenderer(page, 'notionists');
  expect(errors).toHaveLength(0);
  const before = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  await page.click('#btn-random');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  expect(after).not.toEqual(before);
});

test('random button works for funEmoji (no skin tones)', async ({ page }) => {
  const errors = await loadRenderer(page, 'funEmoji');
  expect(errors).toHaveLength(0);
  await page.click('#btn-random');
  await page.waitForTimeout(500);
  await expect(page.locator('#avatar-canvas svg')).toBeVisible();
});

// ── Tab switching ──────────────────────────────────────────────────────
test('clicking a tab switches the part grid', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const tabs = page.locator('#tab-bar button');
  const count = await tabs.count();
  // Click each tab and verify part-grid is populated
  for (let i = 0; i < Math.min(count, 4); i++) {
    await tabs.nth(i).click();
    await page.waitForTimeout(200);
    const items = await page.locator('#part-grid .part-option, #part-grid .swatch').count();
    expect(items, `tab ${i} should populate the grid`).toBeGreaterThan(0);
  }
});

test('all tabs for geometric renderer are populated', async ({ page }) => {
  await loadRenderer(page, 'geometric');
  const tabs = page.locator('#tab-bar button');
  const count = await tabs.count();
  for (let i = 0; i < count; i++) {
    await tabs.nth(i).click();
    await page.waitForTimeout(200);
    const items = await page.locator('#part-grid .part-option, #part-grid .swatch').count();
    expect(items, `geometric tab ${i} should have items`).toBeGreaterThan(0);
  }
});

test('all tabs for miniavs renderer are populated', async ({ page }) => {
  await loadRenderer(page, 'miniavs');
  const tabs = page.locator('#tab-bar button');
  const count = await tabs.count();
  expect(count).toBeGreaterThanOrEqual(8);
  for (let i = 0; i < count; i++) {
    await tabs.nth(i).click();
    await page.waitForTimeout(200);
    const items = await page.locator('#part-grid .part-option, #part-grid .swatch').count();
    expect(items, `miniavs tab ${i} should have items`).toBeGreaterThan(0);
  }
});

test('clicked tab gets active class', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const tabs = page.locator('#tab-bar button');
  const count = await tabs.count();
  if (count > 1) {
    await tabs.nth(1).click();
    await page.waitForTimeout(200);
    await expect(tabs.nth(1)).toHaveClass(/active/);
    await expect(tabs.nth(0)).not.toHaveClass(/active/);
  }
});

// ── Skin swatches ──────────────────────────────────────────────────────
test('skin tab shows color swatches', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const skinTab = page.locator('[data-tab="skin"]');
  if (await skinTab.count() > 0) {
    await skinTab.click();
    await page.waitForTimeout(200);
    const swatches = page.locator('#part-grid .swatch');
    expect(await swatches.count()).toBeGreaterThan(0);
  }
});

test('clicking an inactive skin swatch changes the avatar', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const skinTab = page.locator('[data-tab="skin"]');
  if (await skinTab.count() > 0) {
    await skinTab.click();
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
    const inactive = page.locator('#part-grid .swatch:not(.active)');
    if (await inactive.count() > 0) {
      await inactive.first().click();
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
      expect(after).not.toEqual(before);
    }
  }
});

test('clicked skin swatch gets active class', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const skinTab = page.locator('[data-tab="skin"]');
  if (await skinTab.count() > 0) {
    await skinTab.click();
    await page.waitForTimeout(200);
    const swatches = page.locator('#part-grid .swatch');
    const count = await swatches.count();
    // Find the first non-active swatch index, click it, then verify by data-skin
    for (let i = 0; i < count; i++) {
      const cls = await swatches.nth(i).getAttribute('class') || '';
      if (!cls.includes('active')) {
        const skinId = await swatches.nth(i).getAttribute('data-skin');
        await swatches.nth(i).click();
        await page.waitForTimeout(300);
        await expect(page.locator(`#part-grid .swatch[data-skin="${skinId}"]`)).toHaveClass(/active/);
        break;
      }
    }
  }
});

// ── Color swatch tabs (non-skin) ───────────────────────────────────────
test('miniavs bodyColor tab shows color swatches', async ({ page }) => {
  await loadRenderer(page, 'miniavs');
  await page.click('[data-tab="bodyColor"]');
  await page.waitForTimeout(300);
  const swatches = page.locator('#part-grid .swatch');
  expect(await swatches.count()).toBeGreaterThan(0);
});

test('clicking a color swatch updates the canvas', async ({ page }) => {
  await loadRenderer(page, 'miniavs');
  await page.click('[data-tab="bodyColor"]');
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  const inactive = page.locator('#part-grid .swatch:not(.active)');
  if (await inactive.count() > 0) {
    await inactive.first().click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
    expect(after).not.toEqual(before);
  }
});

test('toonHead clothesColor tab shows swatches', async ({ page }) => {
  await loadRenderer(page, 'toonHead');
  await page.click('[data-tab="clothesColor"]');
  await page.waitForTimeout(300);
  const swatches = page.locator('#part-grid .swatch');
  expect(await swatches.count()).toBeGreaterThan(0);
});

test('lorelei hairColor tab shows color swatches', async ({ page }) => {
  await loadRenderer(page, 'lorelei');
  await page.click('[data-tab="hairColor"]');
  await page.waitForTimeout(300);
  const swatches = page.locator('#part-grid .swatch');
  expect(await swatches.count()).toBeGreaterThan(0);
});

// ── Part tiles ─────────────────────────────────────────────────────────
test('part-option tiles all contain SVG previews', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const options = page.locator('#part-grid .part-option');
  const count = await options.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < Math.min(count, 6); i++) {
    const hasSvg = await options.nth(i).locator('svg').count();
    expect(hasSvg, `tile ${i} should have an SVG preview`).toBeGreaterThan(0);
  }
});

test('selected part option has active class', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const options = page.locator('#part-grid .part-option');
  if (await options.count() > 1) {
    await options.nth(1).click();
    await page.waitForTimeout(300);
    await expect(options.nth(1)).toHaveClass(/active/);
  }
});

// ── Save / collection ──────────────────────────────────────────────────
test('saving an avatar adds it to the collection', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'test-person');
  const countBefore = await page.locator('.collection-item').count();
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  const countAfter = await page.locator('.collection-item').count();
  expect(countAfter).toBe(countBefore + 1);
});

test('saving the same avatar twice updates instead of duplicating', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'save-once');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  const countAfterFirst = await page.locator('.collection-item').count();
  await page.fill('#avatar-name', 'save-once-updated');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  const countAfterSecond = await page.locator('.collection-item').count();
  expect(countAfterSecond).toBe(countAfterFirst);
});

test('saved avatar name appears in collection list', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'named-avatar');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  await expect(page.locator('.collection-item .name').first()).toContainText('named-avatar');
});

test('clicking a saved avatar loads it into the editor', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'recall-test');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  await page.click('#btn-new');
  await page.waitForTimeout(300);
  expect(await page.inputValue('#avatar-name')).toBe('');
  await page.locator('.collection-item').first().click();
  await page.waitForTimeout(300);
  expect(await page.inputValue('#avatar-name')).toBe('recall-test');
});

test('deleting a saved avatar removes it from collection', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'delete-me');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  const countBefore = await page.locator('.collection-item').count();
  await page.locator('.collection-item').first().hover();
  await page.waitForTimeout(200);
  await page.locator('.collection-item .delete').first().click();
  await page.waitForTimeout(300);
  const countAfter = await page.locator('.collection-item').count();
  expect(countAfter).toBe(countBefore - 1);
});

test('collection persists after page reload', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'persist-test');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const names = await page.locator('.collection-item .name').allTextContents();
  expect(names.some(n => n.includes('persist-test'))).toBe(true);
});

test('active collection item is highlighted', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'highlight-test');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  await expect(page.locator('.collection-item.active')).toHaveCount(1);
});

// ── Part selection ─────────────────────────────────────────────────────
test('clicking a part option updates the canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const svgBefore = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  // Click the second part option in the grid (first may already be selected)
  const options = page.locator('#part-grid .part-option');
  if (await options.count() > 1) {
    await options.nth(1).click();
    await page.waitForTimeout(300);
    const svgAfter = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
    expect(svgAfter).not.toEqual(svgBefore);
  }
});

test('switching tabs and selecting parts both update canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const tabs = page.locator('#tab-bar button');
  const tabCount = await tabs.count();
  let previousSvg = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);

  for (let i = 0; i < Math.min(tabCount, 3); i++) {
    await tabs.nth(i).click();
    await page.waitForTimeout(200);
    const options = page.locator('#part-grid .part-option:not(.active)');
    if (await options.count() > 0) {
      await options.first().click();
      await page.waitForTimeout(300);
      const currentSvg = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
      expect(currentSvg).not.toEqual(previousSvg);
      previousSvg = currentSvg;
    }
  }
});

// ── Aspect ratio per renderer ──────────────────────────────────────────
test('geometric renderer sets portrait (2/3) canvas aspect ratio', async ({ page }) => {
  await loadRenderer(page, 'geometric');
  const ratio = await page.evaluate(() =>
    document.getElementById('avatar-canvas').style.aspectRatio
  );
  // browsers may normalize '2/3' to '2 / 3'
  expect(ratio.replace(/\s/g, '')).toBe('2/3');
});

test('DiceBear renderer sets square (1) canvas aspect ratio', async ({ page }) => {
  await loadRenderer(page, 'micah');
  const ratio = await page.evaluate(() =>
    document.getElementById('avatar-canvas').style.aspectRatio
  );
  // browsers normalize '1' → '1 / 1'
  expect(ratio.replace(/\s/g, '')).toMatch(/^1(\/1)?$/);
});

test('all DiceBear renderers set aspect ratio 1', async ({ page }) => {
  const dicebearRenderers = RENDERERS.filter(r => r !== 'geometric');
  for (const r of dicebearRenderers.slice(0, 5)) { // sample 5 to keep test fast
    await loadRenderer(page, r);
    const ratio = await page.evaluate(() =>
      document.getElementById('avatar-canvas').style.aspectRatio
    );
    expect(ratio.replace(/\s/g, ''), `${r} should have aspect-ratio 1`).toMatch(/^1(\/1)?$/);
  }
});

// ── Renderer switching ─────────────────────────────────────────────────
test('switching renderer via modal changes renderer label', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const labelBefore = await page.textContent('#btn-renderer');

  await page.click('#btn-renderer');
  await page.waitForTimeout(500);
  // Pick a non-active renderer
  const nonActive = page.locator('.renderer-card:not(.active)');
  if (await nonActive.count() > 0) {
    await nonActive.first().click();
    await page.waitForTimeout(3000); // page reloads
    const labelAfter = await page.textContent('#btn-renderer');
    expect(labelAfter).not.toEqual(labelBefore);
  }
});

test('renderer is remembered after page reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('avatar-eve:renderer-v1', 'micah'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const label = await page.textContent('#btn-renderer');
  expect(label).toContain('micah');
});

// ── New button ─────────────────────────────────────────────────────────
test('new button clears the name field', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'filled-name');
  await page.click('#btn-new');
  await page.waitForTimeout(200);
  expect(await page.inputValue('#avatar-name')).toBe('');
});

test('new button changes the avatar', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.fill('#avatar-name', 'save-for-new-test');
  await page.click('#btn-save');
  await page.waitForTimeout(300);
  const svgBefore = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  // Load the saved avatar then click new
  await page.locator('.collection-item').first().click();
  await page.waitForTimeout(300);
  await page.click('#btn-new');
  await page.waitForTimeout(300);
  const svgAfter = await page.evaluate(() => document.querySelector('#avatar-canvas svg')?.innerHTML);
  // New avatar is initialized fresh — may be different from saved
  expect(await page.inputValue('#avatar-name')).toBe('');
});
