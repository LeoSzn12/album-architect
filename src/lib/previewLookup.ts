/**
 * Finds a 30-second preview clip for a song.
 * The server build asks /api/songs/preview. The static web build
 * (NEXT_PUBLIC_STATIC_SITE=1) has no server, so it asks the public
 * iTunes Search API straight from the browser, through JSONP.
 */
export interface PreviewLookup {
  previewUrl: string | null;
  artworkUrl: string | null;
}

const EMPTY: PreviewLookup = { previewUrl: null, artworkUrl: null };
const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';

interface ItunesResult {
  previewUrl?: string;
  artworkUrl100?: string;
  artistName?: string;
}

function normalize(value?: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function artistMatches(candidate?: string, target?: string): boolean {
  const c = normalize(candidate);
  const t = normalize(target);
  if (!c || !t) return false;
  const firstWord = normalize((target || '').split(/[\s,&]+/)[0]);
  return c.includes(t) || t.includes(c) || (firstWord.length >= 3 && c.includes(firstWord));
}

let jsonpCounter = 0;

function itunesJsonp(term: string): Promise<ItunesResult[]> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') { resolve([]); return; }
    const name = `__firstWeekItunes${Date.now()}_${jsonpCounter++}`;
    const script = document.createElement('script');
    const w = window as unknown as Record<string, unknown>;
    const finish = (results: ItunesResult[]) => {
      clearTimeout(timer);
      delete w[name];
      script.remove();
      resolve(results);
    };
    const timer = setTimeout(() => finish([]), 5000);
    w[name] = (data: { results?: ItunesResult[] }) => finish(Array.isArray(data?.results) ? data.results : []);
    script.onerror = () => finish([]);
    script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5&country=US&callback=${name}`;
    document.head.appendChild(script);
  });
}

export async function lookupPreview(title: string, artist: string): Promise<PreviewLookup> {
  try {
    if (STATIC_SITE) {
      const results = await itunesJsonp(`${title} ${artist}`.slice(0, 100));
      const match = results.find((r) => r.previewUrl && artistMatches(r.artistName, artist));
      if (!match?.previewUrl) return EMPTY;
      return {
        previewUrl: match.previewUrl,
        artworkUrl: match.artworkUrl100 ? match.artworkUrl100.replace('100x100', '600x600') : null,
      };
    }
    const res = await fetch(`/api/songs/preview?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as { previewUrl?: string | null; artworkUrl?: string | null };
    return { previewUrl: data.previewUrl ?? null, artworkUrl: data.artworkUrl ?? null };
  } catch {
    return EMPTY;
  }
}
