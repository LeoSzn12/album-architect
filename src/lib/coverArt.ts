// Cover links from Apple (mzstatic.com) and Deezer (dzcdn.net) carry the image
// size in the link, and the same link serves smaller sizes. Covers in the game
// show at 44 to 240 CSS pixels, so asking for ~300px (or ~600px on big, sharp
// screens) avoids downloading 4 to 10 times more image than the screen shows.

const APPLE_SIZE = /\/\d+x\d+bb\.(jpg|jpeg|png|webp)$/i;
const DEEZER_SIZE = /\/\d+x\d+-000000-80-0-0\.jpg$/i;

function isApple(url: string) { return url.includes('mzstatic.com') && APPLE_SIZE.test(url); }
function isDeezer(url: string) { return url.includes('dzcdn.net') && DEEZER_SIZE.test(url); }

/** Returns the cover link at about `px` square (small = ~300, large = ~600), or the link unchanged. */
export function coverSrc(url: string, size: 'small' | 'large' = 'small'): string {
  if (isApple(url)) {
    const px = size === 'large' ? 600 : 300;
    return url.replace(APPLE_SIZE, `/${px}x${px}bb.jpg`);
  }
  if (isDeezer(url)) {
    // Deezer's standard sizes are 250 and 500.
    const px = size === 'large' ? 500 : 250;
    return url.replace(DEEZER_SIZE, `/${px}x${px}-000000-80-0-0.jpg`);
  }
  return url;
}

/** srcSet with a small and a large version, for covers that are big on desktop. */
export function coverSrcSet(url: string): string | undefined {
  if (isApple(url)) return `${coverSrc(url)} 300w, ${coverSrc(url, 'large')} 600w`;
  if (isDeezer(url)) return `${coverSrc(url)} 250w, ${coverSrc(url, 'large')} 500w`;
  return undefined;
}
