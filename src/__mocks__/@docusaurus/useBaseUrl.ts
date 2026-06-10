/**
 * Mock for @docusaurus/useBaseUrl hook.
 * In tests, returns the path with /course/ prefix (matching baseUrl config).
 * Mimics the real behavior: useBaseUrl('/') returns '/course/'
 */
export default function useBaseUrl(url: string): string {
  if (url === '/') {
    return '/course/';
  }
  if (url.startsWith('/')) {
    return `/course${url}`;
  }
  return url;
}
