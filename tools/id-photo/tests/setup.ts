import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatic cleanup after each test for @testing-library/react
afterEach(() => {
  cleanup();
});

// Canvas mock for happy-dom (which doesn't natively support Canvas APIs)
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string = '#000000';
  strokeStyle: string = '#000000';
  lineWidth: number = 1;
  font: string = '10px sans-serif';
  textAlign: string = 'start';
  textBaseline: string = 'alphabetic';
  globalAlpha: number = 1;
  globalCompositeOperation: string = 'source-over';
  imageSmoothingEnabled: boolean = true;
  shadowBlur: number = 0;
  shadowColor: string = 'rgba(0, 0, 0, 0)';
  shadowOffsetX: number = 0;
  shadowOffsetY: number = 0;

  private _imageData: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // Drawing methods
  fillRect(_x: number, _y: number, _w: number, _h: number): void {}
  clearRect(_x: number, _y: number, _w: number, _h: number): void {}
  strokeRect(_x: number, _y: number, _w: number, _h: number): void {}
  beginPath(): void {}
  closePath(): void {}
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  arc(_x: number, _y: number, _r: number, _start: number, _end: number, _ccw?: boolean): void {}
  arcTo(_x1: number, _y1: number, _x2: number, _y2: number, _r: number): void {}
  rect(_x: number, _y: number, _w: number, _h: number): void {}
  fill(): void {}
  stroke(): void {}
  clip(): void {}
  save(): void {}
  restore(): void {}
  translate(_x: number, _y: number): void {}
  rotate(_angle: number): void {}
  scale(_x: number, _y: number): void {}
  transform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void {}
  setTransform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void {}
  resetTransform(): void {}

  drawImage(
    _image: CanvasImageSource,
    _sx: number,
    _sy: number,
    _sw?: number,
    _sh?: number,
    _dx?: number,
    _dy?: number,
    _dw?: number,
    _dh?: number,
  ): void {}

  createImageData(width: number, height: number): ImageData {
    return new ImageData(width, height);
  }

  getImageData(_sx: number, _sy: number, sw: number, sh: number): ImageData {
    if (this._imageData) {
      return this._imageData;
    }
    return new ImageData(sw, sh);
  }

  putImageData(_imageData: ImageData, _dx: number, _dy: number): void {
    this._imageData = _imageData;
  }

  measureText(text: string): TextMetrics {
    return {
      width: text.length * 6,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * 6,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      alphabeticBaseline: 0,
      emHeightAscent: 0,
      emHeightDescent: 0,
      hangingBaseline: 0,
      ideographicBaseline: 0,
    } as TextMetrics;
  }

  fillText(_text: string, _x: number, _y: number, _maxWidth?: number): void {}
  strokeText(_text: string, _x: number, _y: number, _maxWidth?: number): void {}

  createLinearGradient(_x0: number, _y0: number, _x1: number, _y1: number): CanvasGradient {
    return { addColorStop: () => {} } as unknown as CanvasGradient;
  }

  createRadialGradient(
    _x0: number, _y0: number, _r0: number,
    _x1: number, _y1: number, _r1: number,
  ): CanvasGradient {
    return { addColorStop: () => {} } as unknown as CanvasGradient;
  }

  createPattern(
    _image: CanvasImageSource,
    _repetition: string | null,
  ): CanvasPattern | null {
    return null;
  }

  isPointInPath(_x: number, _y: number): boolean {
    return false;
  }

  getLineDash(): number[] {
    return [];
  }

  setLineDash(_segments: number[]): void {}
}

// Patch HTMLCanvasElement.prototype.getContext to return mock context
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextId: string,
  ...args: unknown[]
) {
  if (contextId === '2d') {
    return new MockCanvasRenderingContext2D(this) as unknown as CanvasRenderingContext2D;
  }
  return originalGetContext.call(this, contextId, ...(args as [any]));
} as typeof HTMLCanvasElement.prototype.getContext;

// Mock HTMLCanvasElement.prototype.toBlob
HTMLCanvasElement.prototype.toBlob = function (
  callback: BlobCallback,
  type?: string,
  quality?: number,
): void {
  const mimeType = type || 'image/png';
  // Simulate different sizes for different quality values (for JPEG quality tests)
  let size = 1000;
  if (mimeType === 'image/jpeg' && quality !== undefined) {
    size = Math.floor(500 + quality * 500);
  }
  const blob = new Blob([new ArrayBuffer(size)], { type: mimeType });
  setTimeout(() => callback(blob), 0);
};

// Mock HTMLCanvasElement.prototype.toDataURL
HTMLCanvasElement.prototype.toDataURL = function (
  type?: string,
  _quality?: number,
): string {
  const mimeType = type || 'image/png';
  return `data:${mimeType};base64,MOCK_DATA`;
};

// Ensure ImageData is available globally (happy-dom may not provide it)
if (typeof globalThis.ImageData === 'undefined') {
  class MockImageData implements ImageData {
    readonly data: Uint8ClampedArray<ArrayBuffer>;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace = 'srgb';

    constructor(width: number, height: number);
    constructor(data: Uint8ClampedArray, width: number, height?: number);
    constructor(
      widthOrData: number | Uint8ClampedArray,
      widthOrHeight: number,
      height?: number,
    ) {
      if (widthOrData instanceof Uint8ClampedArray) {
        this.data = widthOrData as Uint8ClampedArray<ArrayBuffer>;
        this.width = widthOrHeight;
        this.height = height ?? (widthOrData.length / (widthOrHeight * 4));
      } else {
        this.width = widthOrData;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      }
    }
  }

  globalThis.ImageData = MockImageData as unknown as typeof ImageData;
}
