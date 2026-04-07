const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API_URL = BACKEND_URL || '';

/* ─── In-memory cache ─── */
const cache = new Map<string, { data: any; ts: number }>();
const inflight = new Map<string, Promise<any>>();

/** TTL rules by endpoint prefix (seconds) */
const TTL: [RegExp, number][] = [
  [/\/programs\/catalog/, 300],
  [/\/subscriptions\/my/, 120],
  [/\/guardians\/my/, 120],
  [/\/dashboard\/batch/, 45],
  [/\/programs\/active/, 60],
  [/\/devices\/dashboard-summary/, 45],
  [/\/health\/daily-report/, 60],
  [/\/health\/aging-rate/, 120],
  [/\/health\/summary/, 60],
  [/\/reminders/, 60],
  [/\/minceur\/weight-goal/, 120],
  [/\/glycemia\/estimate/, 120],
  [/\/programs\/team\/feed/, 30],
  [/\/health\/activity-streak/, 60],
  [/\/nora\/predictive-check/, 120],
];

function getTTL(endpoint: string): number {
  for (const [re, ttl] of TTL) { if (re.test(endpoint)) return ttl; }
  return 0; // no cache by default
}

export function clearApiCache(pattern?: RegExp) {
  if (!pattern) { cache.clear(); inflight.clear(); return; }
  for (const key of cache.keys()) { if (pattern.test(key)) cache.delete(key); }
  for (const key of inflight.keys()) { if (pattern.test(key)) inflight.delete(key); }
}

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
) => {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET' && !options.body;

  // Cache: only GET requests
  if (isGet) {
    const ttl = getTTL(endpoint);
    const cacheKey = `${endpoint}::${token?.slice(-8) || ''}`;

    // Return cached if fresh
    if (ttl > 0) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.ts < ttl * 1000) {
        return cached.data;
      }
    }

    // Deduplicate: if same request is in-flight, reuse it
    if (inflight.has(cacheKey)) {
      return inflight.get(cacheKey);
    }

    const promise = _doFetch(endpoint, options, token).then(data => {
      if (ttl > 0) cache.set(cacheKey, { data, ts: Date.now() });
      inflight.delete(cacheKey);
      return data;
    }).catch(err => {
      inflight.delete(cacheKey);
      throw err;
    });

    inflight.set(cacheKey, promise);
    return promise;
  }

  // Mutating requests: clear related cache entries & fetch
  const result = await _doFetch(endpoint, options, token);
  // Invalidate related caches on POST/PUT/DELETE
  const base = endpoint.split('/').slice(0, 3).join('/');
  clearApiCache(new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  return result;
};

async function _doFetch(endpoint: string, options: RequestInit, token?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, cache: 'no-store' } as any);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `Erreur ${response.status}` }));
      throw new Error(error.detail || `Erreur ${response.status}`);
    }
    return response.json();
  } catch (e: any) {
    if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('Network') || e.message.includes('fetch') || e.message.includes('Load failed'))) {
      throw new Error('Erreur de connexion. Vérifiéz votre connexion internet.');
    }
    throw e;
  }
}
