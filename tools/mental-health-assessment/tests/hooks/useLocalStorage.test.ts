import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initialValue when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from localStorage on mount', () => {
    localStorage.setItem('testKey', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('writes to localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('testKey')!)).toBe('updated');
  });

  it('supports functional updates like useState', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(JSON.parse(localStorage.getItem('counter')!)).toBe(1);
  });

  it('returns initialValue when localStorage contains corrupted data', () => {
    localStorage.setItem('testKey', 'not-valid-json{{{');
    const { result } = renderHook(() => useLocalStorage('testKey', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('works with complex objects', () => {
    const initial = { name: 'test', items: [1, 2, 3] };
    const { result } = renderHook(() => useLocalStorage('objKey', initial));

    expect(result.current[0]).toEqual(initial);

    const updated = { name: 'updated', items: [4, 5, 6] };
    act(() => {
      result.current[1](updated);
    });

    expect(result.current[0]).toEqual(updated);
    expect(JSON.parse(localStorage.getItem('objKey')!)).toEqual(updated);
  });

  it('works with arrays', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('arrKey', []));

    act(() => {
      result.current[1](['a', 'b', 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('handles null as a valid stored value', () => {
    localStorage.setItem('nullKey', JSON.stringify(null));
    const { result } = renderHook(() => useLocalStorage('nullKey', 'default'));
    expect(result.current[0]).toBeNull();
  });

  it('syncs state with localStorage on every write', () => {
    const { result } = renderHook(() => useLocalStorage('syncKey', 0));

    act(() => {
      result.current[1](1);
    });
    expect(JSON.parse(localStorage.getItem('syncKey')!)).toBe(1);

    act(() => {
      result.current[1](2);
    });
    expect(JSON.parse(localStorage.getItem('syncKey')!)).toBe(2);

    act(() => {
      result.current[1](3);
    });
    expect(JSON.parse(localStorage.getItem('syncKey')!)).toBe(3);
  });
});
