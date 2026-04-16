import { createDataSource } from './data-source.factory'
import type { DataSourceType, RawPool } from './data-source.interface'
import { normalizePools } from './normalizer'

type Failure = {
  source: DataSourceType
  error: string
}

type RunFallbackInput = {
  selectedSource: DataSourceType
  fallbackOrder: DataSourceType[]
  timeoutMs: number
  minPools: number
}

export type FallbackResult = {
  pools: ReturnType<typeof normalizePools>
  usedSource: DataSourceType | null
  attemptedSources: DataSourceType[]
  failures: Failure[]
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms)
    p.then((v) => {
      clearTimeout(id)
      resolve(v)
    }).catch((e) => {
      clearTimeout(id)
      reject(e)
    })
  })
}

function toMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}

function uniqueOrder(selected: DataSourceType, order: DataSourceType[]): DataSourceType[] {
  const seen = new Set<DataSourceType>()
  const out: DataSourceType[] = []
  for (const s of [selected, ...order]) {
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

export async function runWithFallback(input: RunFallbackInput): Promise<FallbackResult> {
  const attempts = uniqueOrder(input.selectedSource, input.fallbackOrder)
  const attemptedSources: DataSourceType[] = []
  const failures: Failure[] = []

  for (const sourceType of attempts) {
    attemptedSources.push(sourceType)
    try {
      const source = createDataSource(sourceType)
      const rawPools = await withTimeout<RawPool[]>(source.fetchPools({ now: Date.now() }), input.timeoutMs)
      const pools = normalizePools(rawPools)
      if (pools.length < input.minPools) {
        failures.push({ source: sourceType, error: `min_pools:${pools.length}` })
        continue
      }

      return {
        pools,
        usedSource: sourceType,
        attemptedSources,
        failures,
      }
    } catch (e) {
      failures.push({ source: sourceType, error: toMsg(e) })
    }
  }

  return {
    pools: [],
    usedSource: null,
    attemptedSources,
    failures,
  }
}
