import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient, getSupabaseIdentity } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Permanently deletes the authenticated account and its cascaded TrackDraft data. */
export async function DELETE() {
  const identity = await getSupabaseIdentity();
  if (!identity.configured) return NextResponse.json({ error: 'Supabase Auth is not configured.' }, { status: 503 });
  if (!identity.user) return NextResponse.json({ error: 'Sign in before deleting your account.' }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Account deletion is not enabled until SUPABASE_SERVICE_ROLE_KEY is configured.' }, { status: 503 });

  const { error } = await admin.auth.admin.deleteUser(identity.user.id, false);
  if (error) return NextResponse.json({ error: 'Account deletion could not be completed.' }, { status: 503 });

  const client = await createSupabaseServerClient();
  await client?.auth.signOut();
  return NextResponse.json({ deleted: true });
}
