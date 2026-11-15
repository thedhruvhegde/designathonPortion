/* Storage adapters for the live doc. Memory for the local server; Upstash Redis REST on Vercel.
   Both expose get(key) and cas(key, expectedVersion, doc). The version check is atomic, so first tap wins. */
const mem = new Map();
export const memoryStore = {
  kind: 'memory',
  async get(key) { return mem.get(key) ?? null; },
  async cas(key, expected, doc) { const cur = mem.get(key); if ((cur?.v ?? 0) !== expected) return false; mem.set(key, doc); return true; },
};

const CAS_LUA = `local cur = redis.call('GET', KEYS[1])
local v = 0
if cur then v = cjson.decode(cur)['v'] end
if tonumber(v) ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', 86400)
return 1`;

export function upstashStore(url, token) {
  const call = async (cmd) => {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
    if (!r.ok) throw new Error('upstash ' + r.status); return (await r.json()).result;
  };
  return {
    kind: 'upstash',
    async get(key) { const v = await call(['GET', key]); return v ? JSON.parse(v) : null; },
    async cas(key, expected, doc) { return (await call(['EVAL', CAS_LUA, '1', key, String(expected), JSON.stringify(doc)])) === 1; },
  };
}

export function pickStore(env = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL, token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? upstashStore(url, token) : memoryStore;
}
