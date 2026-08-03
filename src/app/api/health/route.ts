import { NextResponse } from 'next/server';
import { getOAuthProviderConfig } from '@/lib/providers/oauth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

export async function GET() {
  const checks = {
    app: true,
    supabase: isSupabaseConfigured(),
    accountDeletion: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    spotifyOAuth: Boolean(getOAuthProviderConfig('spotify')),
    youtubeOAuth: Boolean(getOAuthProviderConfig('youtube')),
    providerSessionSecret: Boolean(process.env.PROVIDER_SESSION_SECRET?.trim()),
  };

  return NextResponse.json({
    status: 'ok',
    checks,
    build: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local',
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
