import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * E2E smoke test: Drag-and-drop upload and clipboard paste upload
 * Validates: Requirements 1.2, 1.3
 */
test.describe('Alternative upload methods', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id-photo');
  });

  test('drag-and-drop upload displays image preview', async ({ page }) => {
    const testImagePath = path.resolve(__dirname, 'fixtures/test-photo.jpg');
    const fileBuffer = fs.readFileSync(testImagePath);

    // Locate the drop zone
    const dropZone = page.locator('[data-testid="drop-zone"]');
    await expect(dropZone).toBeVisible();

    // Create a DataTransfer with the file and dispatch drop event
    await dropZone.dispatchEvent('dragenter', {});
    await dropZone.dispatchEvent('dragover', {});

    // Use Playwright's file drop API
    const dataTransfer = await page.evaluateHandle(
      async ({ buffer, fileName }) => {
        const dt = new DataTransfer();
        const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        dt.items.add(file);
        return dt;
      },
      { buffer: Array.from(fileBuffer), fileName: 'test-photo.jpg' }
    );

    await dropZone.dispatchEvent('drop', { dataTransfer });

    // Verify image preview is displayed after drop
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('drag-and-drop shows visual indicator on dragover', async ({ page }) => {
    const dropZone = page.locator('[data-testid="drop-zone"]');
    await expect(dropZone).toBeVisible();

    // Dispatch dragenter event
    await dropZone.dispatchEvent('dragenter', {});

    // Verify visual indicator is shown (e.g., a CSS class or border change)
    await expect(dropZone).toHaveClass(/drag-over|border-blue|ring/);
  });

  test('clipboard paste upload displays image preview', async ({ page }) => {
    const testImagePath = path.resolve(__dirname, 'fixtures/test-photo.jpg');
    const fileBuffer = fs.readFileSync(testImagePath);

    // Simulate a paste event with image data on the clipboard
    await page.evaluate(
      async ({ buffer }) => {
        const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
        const file = new File([blob], 'pasted-image.jpg', { type: 'image/jpeg' });

        const clipboardData = new DataTransfer();
        clipboardData.items.add(file);

        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData,
          bubbles: true,
          cancelable: true,
        });

        document.dispatchEvent(pasteEvent);
      },
      { buffer: Array.from(fileBuffer) }
    );

    // Verify image preview is displayed after paste
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('clipboard paste with non-image data does not trigger upload', async ({ page }) => {
    // Simulate pasting text (not image)
    await page.evaluate(() => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', 'Hello world');

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(pasteEvent);
    });

    // Verify no image preview is shown
    await expect(page.locator('[data-testid="image-preview"]')).not.toBeVisible();
  });
});
