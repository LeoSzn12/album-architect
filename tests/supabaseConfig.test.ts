import assert from 'node:assert/strict';
import test from 'node:test';
import { isSupabaseConfigured, supabaseConfig } from '../src/lib/supabase/config.ts';

test('Supabase configuration is opt-in and supports the current publishable key name', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousPublishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const previousAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(isSupabaseConfigured(), false);
    assert.equal(supabaseConfig(), null);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';
    assert.deepEqual(supabaseConfig(), {
      url: 'https://example.supabase.co',
      publishableKey: 'publishable-key',
    });

    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'legacy-anon-key';
    assert.equal(isSupabaseConfigured(), true);
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousPublishable === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousPublishable;
    if (previousAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnon;
  }
});
