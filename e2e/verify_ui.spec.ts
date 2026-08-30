import { test, expect } from '@playwright/test';

test('verify options page html structure', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/options.html');
  await expect(page.locator('h1')).toContainText('Search Settings');
  await expect(page.locator('#save')).toBeVisible();
});

test('verify popup page html structure', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/popup.html');
  await expect(page.locator('#toggleBtn')).toBeVisible();
});
