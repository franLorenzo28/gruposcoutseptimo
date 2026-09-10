export type EventItem = {
  id: string | number;
  title: string;
  date: string;
  location: string;
  participants: string;
  type: string;
  status: string;
  image?: string;
  href?: string;
  sort_order?: number;
  columns?: Record<string, string>;
};

const fieldColumns = {
  title: ['titulo', 'title'], date: ['fecha_inicio', 'date'],
  location: ['lugar', 'location'], participants: ['participants'],
  type: ['type'], status: ['status'], image: ['image'], href: ['href'],
  sort_order: ['sort_order'],
} as const;

export function mapEvent(row: Record<string, unknown>): EventItem {
  const event: EventItem = {
    id: row.id as string | number, title: '', date: '', location: '',
    participants: '', type: '', status: 'Confirmado', columns: {},
  };
  for (const [field, candidates] of Object.entries(fieldColumns)) {
    const column = candidates.find((key) => Object.prototype.hasOwnProperty.call(row, key));
    if (column) {
      event.columns![field] = column;
      if (row[column] != null) Object.assign(event, { [field]: row[column] });
    }
  }
  return event;
}

export function eventUpdatePayload(event: EventItem, updates: Partial<EventItem>): Record<string, unknown> {
  if (!event.columns) throw new Error('Recarga los eventos antes de guardar cambios.');
  const payload: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(event.columns)) {
    const value = updates[field as keyof EventItem];
    if (value !== undefined) payload[column] = value;
  }
  return payload;
}
