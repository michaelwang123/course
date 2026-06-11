import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E smoke test: Verify no network requests containing image data (privacy)
 * Validates: Requirements 8.1, 8.2
 *
 * The ID Photo Tool operates entirely in the browser (Privacy Mode).
 * No image data should ever be transmitted over the network.
 */
test.describe('Privacy - No network requests with image data', () => {
  test('no outbound requests contain image data during full workflow', async ({ page }) => {
    // Collect all network requests made during the test
    const requests: { url: string; method: string; postData: string | null }[] = [];

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
      });
    });

    await page.goto('/id-photo');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.resolve(__dirname, 'fixtures/test-photo.jpg');
    await fileInput.setInputFiles(testImagePath);

    // Wait for preview
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

    // Navigate to crop
    await page.locator('[data-testid="step-crop"]').click();
    await page.locator('[data-testid="size-1-inch"]').click();
    await page.locator('[data-testid="confirm-crop"]').click();

    // Navigate to background change
    await page.locator('[data-testid="step-background"]').click();
    await page.locator('[data-testid="color-blue"]').click();

    // Wait for processing
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeHidden({
      timeout: 10000,
    });

    // Navigate to export
    await page.locator('[data-testid="step-export"]').click();
    await page.locator('[data-testid="export-button"]').click();

    // Filter out requests to localhost (dev server static assets)
    const externalRequests = requests.filter(
      (r) => !r.url.startsWith('http://localhost')
    );

    // Verify no external requests were made at all
    expect(externalRequests).toHaveLength(0);

    // Additionally verify no requests contain base64 image data or binary blobs
    const imageDataPatterns = [
      /data:image\//,
      /base64/,
      /\.jpg|\.jpeg|\.png|\.webp/,
    ];

    for (const request of requests) {
      // Skip static asset requests from the dev server
      if (request.url.startsWith('http://localhost:5173')) continue;

      // No POST request should contain image data
      if (request.postData) {
        for (const pattern of imageDataPatterns) {
          expect(request.postData).not.toMatch(pattern);
        }
      }
    }
  });

  test('no localStorage or sessionStorage contains image data after workflow', async ({ page }) => {
    await page.goto('/id-photo');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.resolve(__dirname, 'fixtures/test-photo.jpg');
    await fileInput.setInputFiles(testImagePath);

    // Wait for preview
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

    // Perform some processing
    await page.locator('[data-testid="step-crop"]').click();
    await page.locator('[data-testid="size-1-inch"]').click();
    await page.locator('[data-testid="confirm-crop"]').click();

    // Check localStorage and sessionStorage for image data
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) data[key] = localStorage.getItem(key) || '';
      }
      return data;
    });

    const sessionStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) data[key] = sessionStorage.getItem(key) || '';
      }
      return data;
    });

    // Verify no image data in storage
    const allStorageValues = [
      ...Object.values(localStorageData),
      ...Object.values(sessionStorageData),
    ];

    for (const value of allStorageValues) {
      expect(value).not.toMatch(/data:image\//);
      expect(value.length).toBeLessThan(1024 * 1024); // No value > 1MB (would indicate image data)
    }
  });
});
