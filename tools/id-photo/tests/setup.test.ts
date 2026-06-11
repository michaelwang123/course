import { describe, it, expect } from 'vitest';

describe('Test infrastructure', () => {
  it('should have happy-dom environment with Canvas mock', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
  });

  it('should have ImageData available', () => {
    const imageData = new ImageData(10, 10);
    expect(imageData.width).toBe(10);
    expect(imageData.height).toBe(10);
    expect(imageData.data).toBeInstanceOf(Uint8ClampedArray);
    expect(imageData.data.length).toBe(10 * 10 * 4);
  });

  it('should support canvas toBlob', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    expect(blob).not.toBeNull();
    expect(blob!.type).toBe('image/png');
  });

  it('should support canvas toDataURL', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;

    const dataUrl = canvas.toDataURL('image/jpeg');
    expect(dataUrl).toContain('data:image/jpeg');
  });
});
