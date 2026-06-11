import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E smoke test: Upload image → Crop → Export workflow
 * Validates: Requirements 1.2, 2.5
 */
test.describe('Upload → Crop → Export workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id-photo');
  });

  test('completes full upload, crop, and export workflow without errors', async ({ page }) => {
    // Step 1: Upload an image via file input
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.resolve(__dirname, 'fixtures/test-photo.jpg');
    await fileInput.setInputFiles(testImagePath);

    // Verify image preview is displayed
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

    // Step 2: Navigate to crop step
    await page.locator('[data-testid="step-crop"]').click();

    // Select a standard size (一寸)
    await page.locator('[data-testid="size-1-inch"]').click();

    // Verify crop area is visible
    await expect(page.locator('[data-testid="crop-area"]')).toBeVisible();

    // Confirm crop
    await page.locator('[data-testid="confirm-crop"]').click();

    // Step 3: Navigate to export step
    await page.locator('[data-testid="step-export"]').click();

    // Verify export options are visible
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible();

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-button"]').click();
    const download = await downloadPromise;

    // Verify download has correct filename pattern
    expect(download.suggestedFilename()).toMatch(/证件照.*一寸.*25x35mm/);
  });

  test('shows error for unsupported file format', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.resolve(__dirname, 'fixtures/test-file.txt');
    await fileInput.setInputFiles(testFilePath);

    // Verify error message is displayed
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('不支持该文件格式');
  });

  test('shows error for oversized file', async ({ page }) => {
    // This test would need a fixture > 10MB; verify error handling logic
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.resolve(__dirname, 'fixtures/large-file.jpg');
    await fileInput.setInputFiles(testFilePath);

    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('文件大小超过');
  });
});
