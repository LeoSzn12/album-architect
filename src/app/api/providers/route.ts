import { providers } from '@/lib/providers';

export function GET() {
  return Response.json({
    providers: providers.map(({ id, name, capabilities }) => ({ id, name, capabilities })),
  });
}
