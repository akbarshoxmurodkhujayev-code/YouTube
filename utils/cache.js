import NodeCache from 'node-cache';

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600');

const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 120,
  useClones: false
});

export async function withCache(key, fn) {
  // CACHE_TTL=0 bo'lsa — har safar yangi
  if (CACHE_TTL === 0) {
    console.log(`🌐 API CALL (no cache): ${key}`);
    const data = await fn();
    return { data, fromCache: false };
  }

  const cached = cache.get(key);
  if (cached !== undefined) {
    console.log(`✅ CACHE HIT: ${key}`);
    return { data: cached, fromCache: true };
  }

  console.log(`🌐 API CALL: ${key}`);
  const data = await fn();
  cache.set(key, data);
  return { data, fromCache: false };
}

export function getCacheStats() {
  return cache.getStats();
}

export function clearCache() {
  cache.flushAll();
}

export default cache;