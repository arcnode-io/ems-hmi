import { by, device, expect, element } from 'detox';

describe('Template App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show template text', async () => {
    await expect(element(by.text('Dashboard'))).toBeVisible();
  });
});
