import { NextRequest, NextResponse } from 'next/server';
import { isSupportedAuthProvider, startSupabaseOAuth } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase Auth is not configured.' }, { status: 503 });
  }

  const provider = request.nextUrl.searchParams.get('provider')?.trim().toLowerCase() ?? '';
  if (!isSupportedAuthProvider(provider)) {
    return NextResponse.json({ error: 'Supported Supabase Auth providers are Google and GitHub.' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin;
  const redirectTo = new URL('/api/auth/supabase/callback', siteUrl).toString();
  const result = await startSupabaseOAuth(provider, redirectTo);
  if (!result.url) return NextResponse.json({ error: result.error ?? 'Unable to start Supabase Auth.' }, { status: 503 });

  return NextResponse.redirect(result.url);
}
