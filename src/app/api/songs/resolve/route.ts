import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers';
import type { ProviderId } from '@/lib/providers/types';

const allowedHosts = new Set(['open.spotify.com', 'spotify.com', 'youtube.com', 'www.youtube.com', 'music.youtube.com', 'youtu.be']);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { provider?: ProviderId; url?: string } | null;
  if (!body?.url || typeof body.url !== 'string' || body.url.length > 2048) return NextResponse.json({ error: 'A valid provider URL is required.' }, { status: 400 });
  let parsed: URL;
  try { parsed = new URL(body.url); } catch { return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 }); }
  if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname.toLowerCase())) return NextResponse.json({ error: 'Only official Spotify or YouTube URLs are accepted.' }, { status: 400 });
  const provider: ProviderId = body.provider ?? (parsed.hostname.includes('spotify') ? 'spotify' : 'youtube');
  const result = await getProvider(provider).resolveUrl(parsed.toString());
  return result.ok ? NextResponse.json({ song: result.data }) : NextResponse.json({ error: result.error, notice: 'The demo remains playable while provider resolution is disabled.' }, { status: 503 });
}
