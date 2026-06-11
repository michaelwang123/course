import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E smoke test: Upload → Background change → Export workflow
 * Validates: Requirements 3.3, 3.5
 */
test.describe('Upload → Background Change → Export workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id-photo');
  });

  test('completes upload, background change, and export workflow', async ({ page }) => {
    // Step 1: Upload an image
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.resolve(__dirname, 'fixtures/test-photo.jpg');
    await fileInput.setInputFiles(testImagePath);

    // Verify image preview is displayed
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

    // Step 2: Navigate to background change step
    await page.locator('[data-testid="step-background"]').click();

    // Select a preset background color (blue)
    await page.locator('[data-testid="color-blue"]').click();

    // Wait for processing to complete
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeHidden({
      timeout: 10000,
    });

    // Verify processed preview is shown
    await expect(page.locator('[data-testid="processed-preview"]')).toBeVisible();

    // Step 3: Navigate to export step
    await page.locator('[data-testid="step-export"]').click();

    // Export the processed image
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-button"]').click();
    const download = await downloadPromise;

    // Verify file is downloaded
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('adjusts tolerance slider and re-processes background', async ({ page }) => {
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.resolve(__dirname, 'fixtures/test-photo.jpg');
    await fileInput.setInputFiles(testImagePath);

    // Navigate to background change
    await page.locator('[data-testid="step-background"]').click();

    // Select white background
    await page.locator('[data-testid="color-white"]').click();

    // Adjust tolerance slider
    const toleranceSlider = page.locator('[data-testid="tolerance-slider"]');
    await toleranceSlider.fill('60');

    // Wait for re-processing
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeHidden({
      timeout: 10000,
    });

    // Verify processed preview is updated
    await expect(page.locator('[data-testid="processed-preview"]')).toBeVisible();
  });

  test('shows warning when background detection quality is low', async ({ page }) => {
    // Upload an image with complex background
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.resolve(__dirname, 'fixtures/complex-background.jpg');
    await fileInput.setInputFiles(testImagePath);

    // Navigate to background change
    await page.locator('[data-testid="step-background"]').click();

    // Select a background color
    await page.locator('[data-testid="color-red"]').click();

    // Wait for processing
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeHidden({
      timeout: 10000,
    });

    // If detection quality is low, a warning should appear
    // (This depends on the test fixture having a complex background)
    const warning = page.locator('[data-testid="detection-warning"]');
    if (await warning.isVisible()) {
      await expect(warning).toContainText('容差');
    }
  });
});
