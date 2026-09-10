import { describe, expect, it } from 'vitest';
import { eventUpdatePayload, mapEvent } from '@/lib/events';

describe('event schema compatibility', () => {
  it('reads UUID events and writes only the current Spanish schema', () => {
    const event = mapEvent({ id: 'uuid', titulo: 'Campamento', fecha_inicio: '2026-09-26', lugar: 'Parque', descripcion: null });
    expect(event).toMatchObject({ id: 'uuid', title: 'Campamento', location: 'Parque' });
    expect(eventUpdatePayload(event, { ...event, title: 'Nuevo título' })).toEqual({ titulo: 'Nuevo título', fecha_inicio: '2026-09-26', lugar: 'Parque' });
  });
  it('supports legacy English columns without sending Spanish aliases', () => {
    const event = mapEvent({ id: 1, title: 'Camp', date: 'September', location: 'Park', status: 'Pending', sort_order: 2 });
    expect(eventUpdatePayload(event, { title: 'Updated', status: 'Confirmed' })).toEqual({ title: 'Updated', status: 'Confirmed' });
  });
  it('does not treat fallback cards as persisted records', () => {
    expect(() => eventUpdatePayload({ id: 1, title: '', date: '', location: '', type: '', participants: '', status: '' }, { title: 'Changed' })).toThrow();
  });
});
