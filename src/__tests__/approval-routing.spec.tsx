import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RequireApproval from '@/components/RequireApproval';
import { AppRoutes } from '@/routes/AppRoutes';
import type { useSupabaseUser } from '@/providers/AppProviders';

const state = vi.hoisted(() => ({ value: {} as ReturnType<typeof useSupabaseUser> }));
vi.mock('@/providers/AppProviders', () => ({ useSupabaseUser: () => state.value }));
vi.mock('@/components/PendingApprovalScreen', () => ({ default: () => <div>Approval required</div> }));
vi.mock('@/context/MemberAuthContext', () => ({ MemberAuthProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/hooks/useGlobalPresenceHeartbeat', () => ({ useGlobalPresenceHeartbeat: vi.fn() }));
vi.mock('@/app/routes/public-routes', () => ({ publicRoutes: { path: '/', Component: () => <div>Public page</div> } }));
vi.mock('@/app/routes/internal-routes', () => ({ internalRoutes: { path: 'interno', children: [
  { path: 'auth/callback', Component: () => <div>Complete registration</div> },
  { path: 'restablecer-password', Component: () => <div>Recover password</div> },
] } }));
vi.mock('@/app/routes/admin-routes', () => ({ adminRoutes: { path: 'admin', Component: () => <div>Admin</div> } }));
vi.mock('@/app/routes/compatibility-routes', () => ({ compatibilityRoutes: [] }));
vi.mock('@/app/routes/lazy-pages', () => ({ NotFound: () => <div>Not found</div> }));

beforeEach(() => {
  localStorage.clear();
  state.value = { user: { id: 'user', email: 'user@example.com' } as ReturnType<typeof useSupabaseUser>['user'], accountStatus: 'pendiente_aprobacion', isUserLoading: false, refreshUser: vi.fn() };
});
afterEach(cleanup);

describe('account approval', () => {
  it('unblocks the application immediately after approval and sign-out', () => {
    const tree = <MemoryRouter><AppRoutes /></MemoryRouter>;
    const view = render(tree);
    expect(screen.getByText('Approval required')).toBeInTheDocument();
    state.value = { ...state.value, accountStatus: 'activo' };
    view.rerender(<MemoryRouter><AppRoutes /></MemoryRouter>);
    expect(screen.getByText('Public page')).toBeInTheDocument();
    state.value = { ...state.value, accountStatus: 'rechazado' };
    view.rerender(<MemoryRouter><AppRoutes /></MemoryRouter>);
    expect(screen.getByText('Approval required')).toBeInTheDocument();
    state.value = { ...state.value, user: null, accountStatus: null };
    view.rerender(<MemoryRouter><AppRoutes /></MemoryRouter>);
    expect(screen.getByText('Public page')).toBeInTheDocument();
  });

  it.each([['/interno/auth/callback', 'Complete registration'], ['/interno/restablecer-password', 'Recover password']])('keeps %s reachable for pending users', (path, text) => {
    render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText('Approval required')).not.toBeInTheDocument();
  });

  it('does not let stale local storage block an approved profile', () => {
    state.value.accountStatus = 'activo';
    localStorage.setItem('pendingAccountStatus', 'rechazado');
    render(<MemoryRouter><RequireApproval>Private content</RequireApproval></MemoryRouter>);
    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it.each([null, 'pendiente_aprobacion', 'rechazado'])('denies %s even with editable approval metadata and active local storage', (status) => {
    state.value.accountStatus = status;
    state.value.user = { ...state.value.user!, user_metadata: { approved_at: 'today', profile_complete: true } };
    localStorage.setItem('pendingAccountStatus', 'activo');
    render(<MemoryRouter><RequireApproval>Private content</RequireApproval></MemoryRouter>);
    expect(screen.getByText('Approval required')).toBeInTheDocument();
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
  });

  it('hides private content while the profile is revalidating', () => {
    state.value.accountStatus = 'activo';
    const view = render(<MemoryRouter><RequireApproval>Private content</RequireApproval></MemoryRouter>);
    state.value.isUserLoading = true;
    view.rerender(<MemoryRouter><RequireApproval>Private content</RequireApproval></MemoryRouter>);
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
    expect(screen.getByText('Verificando acceso...')).toBeInTheDocument();
  });
});
