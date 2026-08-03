import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function redirectWithStatus(request: NextRequest, status: 'connected' | 'error') {
  const destination = new URL('/', process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin);
  destination.searchParams.set('auth', status);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return redirectWithStatus(request, 'error');

  const client = await createSupabaseServerClient();
  if (!client) return redirectWithStatus(request, 'error');

  const { error } = await client.auth.exchangeCodeForSession(code);
  return redirectWithStatus(request, error ? 'error' : 'connected');
}
