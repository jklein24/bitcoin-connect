export function baseUrlFromUmaDomain(umaDomain: string) {
  const isLocal =
    umaDomain.startsWith('localhost:') || umaDomain.endsWith('.local');
  const protocol = isLocal ? 'http' : 'https';
  const nwcPrefix = !isLocal ? 'nwc.' : '';
  return `${protocol}://${nwcPrefix}${umaDomain}`;
}
