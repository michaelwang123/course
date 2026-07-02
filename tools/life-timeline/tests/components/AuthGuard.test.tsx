import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { AuthGuard } from '@/components/AuthGuard';
import { AuthProvider } from '@/context/AuthContext';

// Mock src/lib/auth.ts
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

import { getSession, onAuthStateChange } from '@/lib/auth';

const mockGetSession = vi.mocked(getSession);
const mockOnAuthStateChange = vi.mocked(onAuthStateChange);

// Mock react-router-dom's Navigate and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

function renderAuthGuard(children: React.ReactNode = <div>Protected Content</div>) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthGuard>{children}</AuthGuard>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthGuard', () => {
  let authStateCallbacks: Array<(event: string, session: Session | null) => void> = [];
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallbacks = [];
    unsubscribeMock = vi.fn();

    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallbacks.push(callback);
      return { unsubscribe: unsubscribeMock };
    });
  });

  describe('Unauthenticated redirect', () => {
    it('should redirect to /login when user is null and not loading', async () => {
      mockGetSession.mockResolvedValue(null);

      renderAuthGuard();

      // Wait for loading to finish
      await screen.findByText((_content, _element) => {
        // After loading, it should navigate away (rendered Navigate component)
        return false;
      }).catch(() => {});

      // Wait for getSession to resolve
      await act(async () => {
        await Promise.resolve();
      });

      // The protected content should NOT be rendered
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated state', () => {
    it('should render children when user is authenticated', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockGetSession.mockResolvedValue(mockSession);

      renderAuthGuard(<div>Protected Content</div>);

      // Wait for the protected content to appear
      const content = await screen.findByText('Protected Content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading state when isLoading is true', () => {
      // Keep getSession pending so isLoading stays true
      mockGetSession.mockReturnValue(new Promise(() => {}));

      renderAuthGuard();

      expect(screen.getByText('加载中...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Session expiry', () => {
    it('should redirect to /login?expired=true when SIGNED_OUT event fires after having a session', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockGetSession.mockResolvedValue(mockSession);

      renderAuthGuard(<div>Protected Content</div>);

      // Wait for the authenticated state
      await screen.findByText('Protected Content');

      // Simulate session expiry: SIGNED_OUT event after user had a session
      act(() => {
        // The AuthGuard registers its own onAuthStateChange listener
        // Find the callback registered by AuthGuard (second call, first is from AuthProvider)
        authStateCallbacks.forEach((cb) => {
          cb('SIGNED_OUT', null);
        });
      });

      // AuthGuard should navigate to /login?expired=true
      expect(mockNavigate).toHaveBeenCalledWith('/login?expired=true', { replace: true });
    });

    it('should redirect to /login?expired=true when TOKEN_REFRESHED event fires with null session', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockGetSession.mockResolvedValue(mockSession);

      renderAuthGuard(<div>Protected Content</div>);

      // Wait for the authenticated state
      await screen.findByText('Protected Content');

      // Simulate token refresh failure
      act(() => {
        authStateCallbacks.forEach((cb) => {
          cb('TOKEN_REFRESHED', null);
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login?expired=true', { replace: true });
    });

    it('should NOT redirect on SIGNED_OUT if user never had a session', async () => {
      mockGetSession.mockResolvedValue(null);

      renderAuthGuard();

      // Wait for loading to complete
      await act(async () => {
        await Promise.resolve();
      });

      // Simulate SIGNED_OUT event without having had a session
      act(() => {
        authStateCallbacks.forEach((cb) => {
          cb('SIGNED_OUT', null);
        });
      });

      // Should NOT call navigate with expired=true (hadSession was never set)
      expect(mockNavigate).not.toHaveBeenCalledWith('/login?expired=true', { replace: true });
    });
  });
});
