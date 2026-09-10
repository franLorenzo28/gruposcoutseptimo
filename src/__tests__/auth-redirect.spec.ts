import { describe, expect, it } from 'vitest';
import { getPostAuthPath } from '@/lib/auth-redirect';

describe('post-login destination', () => {
  it('preserves a guarded route including filters and fragment', () => {
    expect(getPostAuthPath({ state: { from: '/interno/mensajes?grupo=7#ultimo' }, search: '' })).toBe('/interno/mensajes?grupo=7#ultimo');
  });
  it('honors the public access link redirect parameter', () => {
    expect(getPostAuthPath({ state: null, search: '?redirect=%2Fgaleria' })).toBe('/galeria');
  });
  it.each(['https://example.com', '//example.com', '/\\example.com', '/interno/login', '/interno/auth/callback', '/auth', '/interno/', '/login?redirect=/login'])('rejects external destinations and auth loops: %s', (from) => {
    expect(getPostAuthPath({ state: { from }, search: '' })).toBe('/interno/dashboard');
  });
});
