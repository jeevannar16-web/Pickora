import { test, expect, Page } from '@playwright/test';

async function addNames(page: Page, names: string[]) {
  const textarea = page.getByLabel('Bulk add participants');
  await textarea.fill(names.join('\n'));
  await page.getByRole('button', { name: 'Add all' }).click();
}

async function openWinnerSettings(page: Page) {
  await page.getByRole('tab', { name: 'Winner' }).click();
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
    const count = page.getByLabel('Number of winners');
    await count.click();
    await page.getByRole('option', { name: '3' }).click();
    await page.getByLabel('Spin the wheel').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15000 });
    const items = dialog.locator('.text-lg.font-semibold');
    await expect(items).toHaveCount(3);
  });

  test('remove winners from the list', async ({ page }) => {
    await addNames(page, ['One', 'Two', 'Three', 'Four']);
    await openWinnerSettings(page);
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
    await page.getByRole('tab', { name: 'Theme' }).click();
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