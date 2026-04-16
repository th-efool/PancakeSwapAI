const UINT32_MAX = 0x100000000

function hashSeed(seed: number | string): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) return (seed >>> 0) || 1
  const text = String(seed)
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) || 1
}

export function createRng(seed?: number | string): () => number {
  if (seed === undefined || seed === null || seed === '') {
    return () => Math.random()
  }
  let x = hashSeed(seed)
  return () => {
    x += 0x6d2b79f5
    let t = x
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_MAX
  }
}

export function gaussianNoise(rng: () => number): number {
  const u1 = Math.max(rng(), Number.EPSILON)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}
