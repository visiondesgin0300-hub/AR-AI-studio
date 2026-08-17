/**
 * The web build and the Android build disagree about where /api lives.
 *
 * On the web the screens are served by the same Express process that answers
 * /api, so a relative path resolves to the right place on its own. Inside the
 * Android package the screens are loaded from the device itself
 * (https://localhost), and a relative /api would be asked of the device rather
 * than of the server. VITE_API_BASE names the server for those builds.
 *
 * The rewrite happens once, here, instead of at each of the twenty call sites,
 * so that adding a new endpoint needs no knowledge of how the app was packaged.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

function redirect(url: string): string {
  return API_BASE + url;
}

export function installApiBase(): void {
  if (!API_BASE) return;

  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return original(redirect(input), init);
    }
    if (input instanceof URL && input.origin === location.origin
        && input.pathname.startsWith('/api/')) {
      return original(redirect(input.pathname + input.search), init);
    }
    if (input instanceof Request) {
      const url = new URL(input.url);
      if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
        // A Request carries its own method, headers and body, so it is rebuilt
        // around the new URL rather than replaced by a bare string.
        return original(new Request(redirect(url.pathname + url.search), input), init);
      }
    }
    return original(input, init);
  };
}
