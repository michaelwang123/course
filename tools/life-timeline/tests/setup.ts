import '@testing-library/jest-dom';

// Mock window.matchMedia (for useReducedMotion tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver (for viewport measurements)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Mock IntersectionObserver (for potential lazy loading)
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock scrollTo (for timeline scroll operations)
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

// Mock requestAnimationFrame (for drag/animation tests)
if (typeof window.requestAnimationFrame === 'undefined') {
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 0) as unknown as number;
  };
  window.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}
