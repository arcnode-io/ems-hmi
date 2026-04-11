import { test, expect } from '@playwright/test';

test('renders Dashboard title', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Dashboard')).toBeVisible();
});

test('navigates to Settings via drawer', async ({ page }) => {
  await page.goto('/');

  // Open drawer by clicking the menu icon
  await page.getByText('Dashboard').waitFor();
  await page.locator('svg').first().click();

  // Click Settings in the drawer
  await page.getByText('Settings').click();

  // Verify Settings screen content is visible
  await expect(page.getByText('Appearance')).toBeVisible();
});

test('navigates to AI Chat via drawer', async ({ page }) => {
  await page.goto('/');

  // Open drawer
  await page.getByText('Dashboard').waitFor();
  await page.locator('svg').first().click();

  // Click AI Chat in the drawer
  await page.getByText('AI Chat').click();

  // Verify Chat screen is visible
  await expect(page.getByTestId('chat-input')).toBeVisible();
});

test('navigates to Settings via direct URL', async ({ page }) => {
  await page.goto('/settings');

  await expect(page.getByText('Appearance')).toBeVisible();
});

test('navigates to Chat via direct URL', async ({ page }) => {
  await page.goto('/chat');

  await expect(page.getByTestId('chat-input')).toBeVisible();
});
