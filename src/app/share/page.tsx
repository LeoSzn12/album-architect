'use client';

import { useEffect, useState } from 'react';
import { ShareCard } from '@/components/ShareCard';
import { assertSharePayload, decodeSharePayload, type SharePayload } from '@/lib/sharePayload';

export default function SharePage() {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    const token = params.get('token');
    if (encoded) {
      try {
        const decoded = decodeSharePayload(encoded);
        queueMicrotask(() => setPayload(decoded));
      } catch {
        queueMicrotask(() => setError('This share link is invalid or has been truncated.'));
      }
      return;
    }
    if (!token) {
      queueMicrotask(() => setError('This share link is missing its result data.'));
      return;
    }
    void fetch(`/api/share?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json() as { payload?: unknown; error?: string };
        if (!response.ok || !body.payload) throw new Error(body.error ?? 'Share not found.');
        return body.payload;
      })
      .then((value) => {
        assertSharePayload(value);
        setPayload(value);
      })
      .catch(() => setError('This share link is invalid, expired, or unavailable.'));
  }, []);

  return (
    <main className="min-h-screen bg-[#0f1117] px-4 py-10 text-slate-100 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <div className="mb-6 self-start">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">TrackDraft</p>
          <p className="mt-1 text-sm text-slate-400">Shared result</p>
        </div>
        {payload ? <ShareCard payload={payload} /> : (
          <section className="w-full rounded-3xl border border-red-400/20 bg-slate-950 p-8 text-center">
            <h1 className="text-2xl font-black text-white">Unable to load result</h1>
            <p className="mt-2 text-sm text-slate-400">{error || 'Reading share data…'}</p>
          </section>
        )}
      </div>
    </main>
  );
}
