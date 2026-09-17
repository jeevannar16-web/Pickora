import { test, expect, Page } from '@playwright/test';

async function openNamesPanel(page: Page) {
  await page.locator('nav').last().getByRole('button', { name: 'Names', exact: true }).click();
}

async function addNames(page: Page, names: string[]) {
  await openNamesPanel(page);
  const textarea = page.getByLabel('Bulk add participants');
  await textarea.fill(names.join('\n'));
  await page.getByRole('button', { name: 'Add all' }).click();
  await page.getByLabel('Close panel').click();
}

test.describe('Spinora mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('mobile shows wheel near the top with bottom navigation', async ({ page }) => {
    await expect(page.getByRole('img', { name: /^Wheel with/ })).toBeVisible();
    const nav = page.locator('nav').last();
    await expect(nav.getByRole('button', { name: 'Wheel', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Names', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'History', exact: true })).toBeVisible();
    await expect(page.getByLabel('Spin the wheel')).toBeVisible();
  });

  test('mobile participant bottom sheet opens and adds names', async ({ page }) => {
    await addNames(page, ['Alice', 'Bob', 'Carol']);
    await openNamesPanel(page);
    await expect(page.getByText('Participants (3)')).toBeVisible();
  });

  test('mobile spin works end to end', async ({ page }) => {
    await addNames(page, ['Zoe', 'Yolanda', 'Xavier']);
    await page.getByLabel('Spin the wheel').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Winners Selected/ })).toBeVisible();
  });

  test('mobile settings bottom sheet opens', async ({ page }) => {
    await page.locator('nav').last().getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Quick options')).toBeVisible();
    await expect(page.getByRole('button', { name: /Customize/ })).toBeVisible();
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await addNames(page, ['A', 'B', 'C']);
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test('mobile presentation mode exits with escape', async ({ page }) => {
    await addNames(page, ['A', 'B']);
    await page.getByRole('button', { name: 'Enter presentation mode' }).click();
    const dialog = page.getByRole('dialog', { name: 'Presentation mode' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});