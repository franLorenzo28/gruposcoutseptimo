import type { Location } from 'react-router-dom';

export function getPostAuthPath(location: Pick<Location, 'state' | 'search'>): string {
  const candidate = location.state?.from || new URLSearchParams(location.search).get('redirect');
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\') || [...candidate].some((char) => char.charCodeAt(0) <= 32)) {
    return '/interno/dashboard';
  }
  const path = new URL(candidate, 'https://app.local').pathname.replace(/\/+$/, '').toLowerCase();
  if (/^\/(?:auth(?:\/callback)?|login|interno(?:\/(?:auth(?:\/callback)?|login|restablecer-password))?)$/.test(path)) {
    return '/interno/dashboard';
  }
  return candidate;
}
