import { NextRequest, NextResponse } from 'next/server';
import { demoCatalogProvider } from '@/lib/providers';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length > 120) return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 });
  const result = await demoCatalogProvider.search(query, 30);
  return NextResponse.json({ source: 'demo', songs: result.ok ? result.data : [], notice: 'Demo library is read-only until a provider account is connected.' });
}
