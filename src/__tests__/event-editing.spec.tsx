import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Events from '@/components/sections/SeccionEventos';

const mocks = vi.hoisted(() => ({ select: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn() }));
vi.mock('@/hooks/useUser', () => ({ useUser: () => ({ user: { role: 'admin' } }) }));
vi.mock('@/components/Reveal', () => ({ Reveal: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: mocks.select, update: mocks.update }) } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.select.mockResolvedValue({ data: [{ id: 'uuid', titulo: 'Campamento', fecha_inicio: '2026-09-26', lugar: 'Parque' }], error: null });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ select: () => ({ single: mocks.single }) });
  mocks.single.mockResolvedValue({ data: { id: 'uuid' }, error: null });
});
afterEach(cleanup);

describe('event editing', () => {
  it('loads the current schema and saves changes without unknown columns', async () => {
    render(<MemoryRouter><Events /></MemoryRouter>);
    const article = await screen.findByRole('article');
    fireEvent.click(article.querySelector('button')!);
    fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'Nuevo campamento' } });
    expect(screen.getByPlaceholderText('Tipo')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Título')).not.toBeInTheDocument());
    expect(mocks.update).toHaveBeenCalledWith({ titulo: 'Nuevo campamento', fecha_inicio: '2026-09-26', lugar: 'Parque' });
  });
  it('keeps the draft and permits retrying after a denied update', async () => {
    mocks.single.mockResolvedValueOnce({ data: null, error: { message: 'Permission denied' } });
    render(<MemoryRouter><Events /></MemoryRouter>);
    const article = await screen.findByRole('article');
    fireEvent.click(article.querySelector('button')!);
    fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'Mi borrador' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron guardar');
    expect(screen.getByPlaceholderText('Título')).toHaveValue('Mi borrador');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Título')).not.toBeInTheDocument());
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });
  it('shows an empty calendar when the database has no events', async () => {
    mocks.select.mockResolvedValue({ data: [], error: null });
    render(<MemoryRouter><Events /></MemoryRouter>);
    await waitFor(() => expect(mocks.select).toHaveBeenCalled());
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByText('BAUEN')).not.toBeInTheDocument();
  });
});
