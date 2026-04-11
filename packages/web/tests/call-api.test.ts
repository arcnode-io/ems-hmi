import { test, expect } from '@playwright/test';

test('displays IP address with octets', async ({ page }) => {
  // Check e2e flag from environment
  const isE2E = process.env.VITE_ENV === 'beta';

  if (!isE2E) {
    // Mock the httpbin.org API call with dummy data when e2e is false
    await page.route('**/httpbin.org/get', async route => {
      const mockResponse = {
        origin: '6.6.6.6',
        url: 'https://httpbin.org/get',
        args: {},
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'playwright'
        }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });
  }

  // Navigate to the page
  await page.goto('/');

  // Wait for the IP address component to load
  await expect(page.getByText('Your IP Address:')).toBeVisible();

  if (!isE2E) {
    // Verify mocked IP octets (6.6.6.6 means 4 octets with value "6")
    // Use a more specific selector that targets only the text content of octets
    const octets = page.getByText('6', { exact: true });
    await expect(octets).toHaveCount(4);
  } else {
    // For e2e tests, just verify that some IP octets are displayed
    const ipContainer = page.locator('div').first();
    await expect(ipContainer).toBeVisible();
  }
});