// Fixes image URLs by ensuring they have a protocol and are absolute
export function fixImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) {
    // Assume relative to API server
    return `${window.location.origin}${url}`;
  }
  // If it's a bare filename or missing slash, treat as relative to /uploads
  if (!url.startsWith('uploads/')) return `${window.location.origin}/uploads/${url}`;
  return `${window.location.origin}/${url}`;
}
