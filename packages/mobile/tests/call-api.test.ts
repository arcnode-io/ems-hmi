import { by, device, element, expect } from 'detox';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

describe('IP Address API Call', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('displays IP address with octets', async () => {
    const cfgPath = join(__dirname, '..', 'cfg.yml');
    const cfgContent = readFileSync(cfgPath, 'utf8');
    const cfg = parse(cfgContent);
    const isE2E = cfg.local.e2e === true;

    // Wait for the IP address component to load
    await expect(element(by.text('Your IP Address:'))).toBeVisible();

    if (isE2E === false) {
      // Verify mocked IP octets (6.6.6.6 means 4 octets with value "6")
      await expect(element(by.text('6')).atIndex(0)).toBeVisible();
    }
  });
});
