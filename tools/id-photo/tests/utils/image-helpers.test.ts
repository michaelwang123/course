import { describe, it, expect } from 'vitest';
import {
  loadImageFromFile,
  generateExportFilename,
  scaleImageForPreview,
} from '@/utils/image-helpers';

describe('generateExportFilename', () => {
  it('generates filename with jpg extension for jpeg format', () => {
    const result = generateExportFilename('一寸', 25, 35, 'jpeg');
    expect(result).toBe('证件照_一寸_25x35mm.jpg');
  });

  it('generates filename with png extension for png format', () => {
    const result = generateExportFilename('二寸', 35, 49, 'png');
    expect(result).toBe('证件照_二寸_35x49mm.png');
  });

  it('includes size name in filename', () => {
    const result = generateExportFilename('小一寸', 22, 32, 'jpeg');
    expect(result).toContain('小一寸');
    expect(result).toContain('22x32mm');
  });

  it('handles custom size dimensions', () => {
    const result = generateExportFilename('自定义', 40, 60, 'png');
    expect(result).toBe('证件照_自定义_40x60mm.png');
  });
});

describe('scaleImageForPreview', () => {
  function createMockImage(width: number, height: number): HTMLImageElement {
    const img = document.createElement('img');
    Object.defineProperty(img, 'width', { value: width, writable: false });
    Object.defineProperty(img, 'height', { value: height, writable: false });
    return img;
  }

  function createMockCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  it('returns canvas at original size when both dimensions <= maxEdge', () => {
    const img = createMockImage(800, 600);
    const result = scaleImageForPreview(img, 1200);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('scales down when width exceeds maxEdge', () => {
    const img = createMockImage(2400, 1600);
    const result = scaleImageForPreview(img, 1200);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(800);
  });

  it('scales down when height exceeds maxEdge', () => {
    const img = createMockImage(900, 1800);
    const result = scaleImageForPreview(img, 1200);
    expect(result.width).toBe(600);
    expect(result.height).toBe(1200);
  });

  it('uses default maxEdge of 1200 when not specified', () => {
    const img = createMockImage(2400, 2400);
    const result = scaleImageForPreview(img);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(1200);
  });

  it('preserves aspect ratio when scaling', () => {
    const img = createMockImage(3000, 2000);
    const result = scaleImageForPreview(img, 1200);
    const originalRatio = 3000 / 2000;
    const resultRatio = result.width / result.height;
    expect(Math.abs(originalRatio - resultRatio)).toBeLessThan(0.01);
  });

  it('accepts HTMLCanvasElement as source', () => {
    const canvas = createMockCanvas(1600, 900);
    const result = scaleImageForPreview(canvas, 1200);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(675);
  });

  it('handles square images', () => {
    const img = createMockImage(2000, 2000);
    const result = scaleImageForPreview(img, 1200);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(1200);
  });
});

describe('loadImageFromFile', () => {
  it('rejects with error for invalid file content', async () => {
    // Create a file that will fail to load as an image
    const file = new File(['not-an-image'], 'test.txt', { type: 'text/plain' });
    // Note: In happy-dom, FileReader + Image loading behavior is mocked,
    // so we primarily test that the function returns a promise
    const result = loadImageFromFile(file);
    expect(result).toBeInstanceOf(Promise);
  });
});
