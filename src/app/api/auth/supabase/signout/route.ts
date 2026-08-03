import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST() {
  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: 'Supabase Auth is not configured.' }, { status: 503 });

  const { error } = await client.auth.signOut();
  return error
    ? NextResponse.json({ error: error.message }, { status: 503 })
    : NextResponse.json({ signedOut: true });
}
