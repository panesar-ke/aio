import type { NextRequest } from 'next/server';

export function getCronSecret(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}
