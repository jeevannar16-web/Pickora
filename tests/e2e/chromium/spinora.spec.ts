import { test, expect, Page } from '@playwright/test';

async function addNames(page: Page, names: string[]) {
  const textarea = page.getByLabel('Bulk add participants');
  await textarea.fill(names.join('\n'));
  await page.getByRole('button', { name: 'Add all' }).click();
}

async function openCustomize(page: Page) {
  await page.getByRole('button', { name: /Customize/ }).click();
}

test.describe('Spinora core flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('add participants and spin the wheel', async ({ page }) => {
    await addNames(page, ['Alice', 'Bob', 'Carol', 'Dave', 'Erin']);
    await expect(page.getByText('Participants (5)')).toBeVisible();
    await expect(page.getByLabel('Spin the wheel')).toBeEnabled();
    await page.getByLabel('Spin the wheel').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Winners Selected/ })).toBeVisible();
  });

  test('select multiple winners', async ({ page }) => {
    await addNames(page, ['A1', 'B2', 'C3', 'D4', 'E5', 'F6']);
    await expect(page.getByTestId('winner-count-cue')).toHaveCount(0);
    const count = page.getByLabel('Number of winners');
    await count.click();
    await page.getByRole('option', { name: '3' }).click();
    await expect(page.getByTestId('winner-count-cue')).toContainText('3 winners');
    await page.getByLabel('Spin the wheel').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15000 });
    const items = dialog.locator('.text-lg.font-semibold');
    await expect(items).toHaveCount(3);
  });

  test('quick options panel renders exactly once — no duplicate settings', async ({ page }) => {
    await addNames(page, ['A', 'B', 'C']);
    await expect(page.getByText('Quick options', { exact: true })).toHaveCount(1);
    // Scope to <main> so we click the WheelStage chip, not the header nav
    // button which resolves to two matches under strict mode.
    await page.getByRole('main').getByRole('button', { name: 'History' }).click();
    await expect(page.getByText('Quick options', { exact: true })).toHaveCount(1);
    await openCustomize(page);
    await expect(page.getByText('Quick options', { exact: true })).toHaveCount(1);
    await page.getByRole('button', { name: 'Participants', exact: true }).click();
    await expect(page.getByText('Quick options', { exact: true })).toHaveCount(1);
  });

  test('winner count clamps live when participants shrink', async ({ page }) => {
    await addNames(page, ['A', 'B', 'C', 'D', 'E']);
    const count = page.getByLabel('Number of winners');
    await count.click();
    await page.getByRole('option', { name: '3' }).click();
    await expect(count).toContainText('3 winners');
    await page.getByLabel('Clear all').click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await addNames(page, ['A', 'B']);
    await expect(count).toContainText('1 winner');
    await count.click();
    await expect(page.getByRole('option', { name: '2 winners' })).toBeVisible();
    await expect(page.getByRole('option', { name: '3 winners' })).toHaveCount(0);
  });

  test('spin still completes when resized mid-spin', async ({ page }) => {
    await addNames(page, ['A', 'B', 'C']);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.getByLabel('Spin the wheel').click();
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 900, height: 700 });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('Spin the wheel')).toBeEnabled();
  });

  test('remove winners from the list', async ({ page }) => {
    await addNames(page, ['One', 'Two', 'Three', 'Four']);
    await openCustomize(page);
    await page.getByLabel('Remove winners from list').click({ trial: true });
    await page.getByLabel('Remove winners from list').click();
    const namesBefore = await page.locator('ul[role="list"] li').count();
    expect(namesBefore).toBe(4);
    await page.getByLabel('Spin the wheel').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    const removed = await page.locator('ul[role="list"] li').count();
    expect(removed).toBe(3);
  });

  test('keep winners in the list', async ({ page }) => {
    await addNames(page, ['One', 'Two', 'Three', 'Four']);
    const namesBefore = await page.locator('ul[role="list"] li').count();
    expect(namesBefore).toBe(4);
    await page.getByLabel('Spin the wheel').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    const namesAfter = await page.locator('ul[role="list"] li').count();
    expect(namesAfter).toBe(namesBefore);
  });

  test('change theme from the settings panel', async ({ page }) => {
    await addNames(page, ['Alice', 'Bob']);
    await page.getByLabel('Apply Ocean theme').click();
    await expect(page.getByLabel('Apply Ocean theme')).toHaveAttribute('aria-pressed', 'true');
  });

  test('save and reload a wheel', async ({ page }) => {
    await addNames(page, ['Alice', 'Bob', 'Carol']);
    await page.getByRole('button', { name: 'Saved Wheels' }).click();
    await page.getByRole('button', { name: 'Save current' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Close' }).first().click();
    await page.reload();
    await page.getByRole('button', { name: 'Saved Wheels' }).click();
    await expect(page.getByRole('button', { name: 'My Wheel 3 participants' })).toBeVisible();
  });

  test('import participants from CSV', async ({ page }) => {
    await page.getByLabel('Import CSV').click();
    await page.locator('input[type=file]').setInputFiles({
      name: 'people.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name\nAlice\nBob\nCarol\n'),
    });
    await expect(page.locator('ul[role="list"] li')).toHaveCount(3);
  });

  test('presentation mode with space to spin', async ({ page }) => {
    await addNames(page, ['Zed', 'Yan', 'Xeo']);
    await page.getByRole('button', { name: 'Presentation', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Presentation mode' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByText('Winners', { exact: true })).toBeVisible({ timeout: 20000 });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('open and close winner modal', async ({ page }) => {
    await addNames(page, ['A', 'B', 'C']);
    await page.getByLabel('Spin the wheel').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.getByRole('button', { name: 'Close' }).first().click();
    await expect(dialog).toBeHidden();
  });

  test('clear participant list', async ({ page }) => {
    await addNames(page, ['A', 'B', 'C']);
    await page.getByLabel('Clear all').click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('No participants yet.')).toBeVisible();
  });

  test('remove duplicate participants', async ({ page }) => {
    await addNames(page, ['Bob', 'Alice', 'bob', 'Alice']);
    await page.getByLabel('Remove duplicates').click();
    await expect(page.locator('ul[role="list"] li')).toHaveCount(2);
  });

  test('winner history records draws', async ({ page }) => {
    await addNames(page, ['A', 'B', 'C']);
    await page.getByLabel('Spin the wheel').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click();
    await page.getByRole('button', { name: /^History/ }).first().click();
    await expect(page.getByText(/draw(s)? recorded/)).toBeVisible();
  });
});