import { providers } from '@/lib/providers';
import { accessTokenFromRequest, createRemoteProvider } from '@/lib/providers/remote';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const runtimeProviders = {
    spotify: createRemoteProvider('spotify', await accessTokenFromRequest(request, 'spotify')),
    youtube: createRemoteProvider('youtube', await accessTokenFromRequest(request, 'youtube')),
  };
  return Response.json({
    providers: providers.map(({ id, name, capabilities }) => {
      const runtimeProvider = id === 'spotify' || id === 'youtube' ? runtimeProviders[id] : null;
      return { id, name, capabilities: runtimeProvider?.capabilities ?? capabilities };
    }),
  });
}
