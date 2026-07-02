import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/context/AuthContext';

// Mock src/lib/auth.ts
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

import { getSession, onAuthStateChange, signInWithGoogle, signOut } from '@/lib/auth';

const mockGetSession = vi.mocked(getSession);
const mockOnAuthStateChange = vi.mocked(onAuthStateChange);
const mockSignInWithGoogle = vi.mocked(signInWithGoogle);
const mockSignOut = vi.mocked(signOut);

// Test helpers
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    app_metadata: {},
    user_metadata: { full_name: 'Test User', avatar_url: 'https://example.com/avatar.png' },
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as User;
}

function createMockSession(user?: User): Session {
  const sessionUser = user ?? createMockUser();
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: sessionUser,
  } as Session;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  let authStateCallback: ((event: string, session: Session | null) => void) | null = null;
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
    unsubscribeMock = vi.fn();

    // Default mock: getSession resolves to null, onAuthStateChange captures callback
    mockGetSession.mockResolvedValue(null);
    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return { unsubscribe: unsubscribeMock };
    });
  });

  describe('Initial state', () => {
    it('should start with isLoading=true, user=null, session=null', () => {
      // Keep getSession pending so isLoading stays true
      mockGetSession.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Session loading', () => {
    it('should set isLoading=false, user and session after session loads', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockGetSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    it('should set isLoading=false with null user/session when no active session', async () => {
      mockGetSession.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('signIn (Google OAuth)', () => {
    it('should call signInWithGoogle when signIn is invoked', async () => {
      mockGetSession.mockResolvedValue(null);
      mockSignInWithGoogle.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('should set error state when signInWithGoogle throws', async () => {
      mockGetSession.mockResolvedValue(null);
      mockSignInWithGoogle.mockRejectedValue(new Error('认证服务不可用'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn();
      });

      expect(result.current.error).toBe('认证服务不可用');
    });

    it('should set error state when signIn is cancelled', async () => {
      mockGetSession.mockResolvedValue(null);
      mockSignInWithGoogle.mockRejectedValue(new Error('认证被取消'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn();
      });

      expect(result.current.error).toBe('认证被取消');
    });

    it('should clear previous error before signing in', async () => {
      mockGetSession.mockResolvedValue(null);
      mockSignInWithGoogle
        .mockRejectedValueOnce(new Error('first error'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First call fails
      await act(async () => {
        await result.current.signIn();
      });
      expect(result.current.error).toBe('first error');

      // Second call succeeds and clears error
      await act(async () => {
        await result.current.signIn();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should clear user and session on successful signOut', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockGetSession.mockResolvedValue(mockSession);
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set error state when signOut throws', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockGetSession.mockResolvedValue(mockSession);
      mockSignOut.mockRejectedValue(new Error('退出登录失败'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.error).toBe('退出登录失败');
      // User and session should NOT be cleared when signOut fails
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });
  });

  describe('Auth state change listener', () => {
    it('should subscribe to auth state changes on mount', async () => {
      mockGetSession.mockResolvedValue(null);

      renderHook(() => useAuth(), { wrapper });

      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
      expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update user/session when auth state changes', async () => {
      mockGetSession.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      // Simulate auth state change (e.g., user signs in via OAuth redirect)
      const newUser = createMockUser({ id: 'new-user-456' });
      const newSession = createMockSession(newUser);

      act(() => {
        authStateCallback!('SIGNED_IN', newSession);
      });

      expect(result.current.user).toEqual(newUser);
      expect(result.current.session).toEqual(newSession);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear user/session when auth state changes to signed out', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockGetSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      act(() => {
        authStateCallback!('SIGNED_OUT', null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should unsubscribe from auth state changes on unmount', async () => {
      mockGetSession.mockResolvedValue(null);

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });
});
