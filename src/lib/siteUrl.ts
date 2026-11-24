/**
 * The game's own web address, including the path it is served under
 * (for example https://leoszn12.github.io/album-architect on GitHub Pages).
 */
export function siteBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');
  return `${window.location.origin}${basePath}`;
}
