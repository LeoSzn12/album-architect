import { NextResponse } from 'next/server';
import { getSupabaseIdentity } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const identity = await getSupabaseIdentity();
  return NextResponse.json({
    configured: identity.configured,
    authenticated: Boolean(identity.user),
    user: identity.user,
  });
}
