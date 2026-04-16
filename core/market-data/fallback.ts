import { createDataSource } from './data-source.factory.js'
import type { DataSourceType, RawPool } from './data-source.interface.js'
import { normalizePoolsDetailed, type NormalizerDebugSummary } from './normalizer.js'

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
  pools: ReturnType<typeof normalizePoolsDetailed>['pools']
  usedSource: DataSourceType | null
  attemptedSources: DataSourceType[]
  failures: Failure[]
  debugSummary: Array<{
    source: DataSourceType
    rawFetchedCount: number
    normalizedCount: number
    rejectedCount: number
    rejectionReasons: NormalizerDebugSummary['rejectionReasons']
  }>
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
  const debugSummary: FallbackResult['debugSummary'] = []
  const effectiveMinPools = 0

  for (const sourceType of attempts) {
    attemptedSources.push(sourceType)
    try {
      const source = createDataSource(sourceType)
      const rawPools = await withTimeout<RawPool[]>(source.fetchPools({ now: Date.now() }), input.timeoutMs)
      console.log(`[${sourceType}] raw response length`, rawPools.length)
      console.log(`[${sourceType}] sample item`, rawPools[0] ?? null)

      const { pools, debug } = normalizePoolsDetailed(rawPools)
      debugSummary.push({
        source: sourceType,
        rawFetchedCount: rawPools.length,
        normalizedCount: debug.normalizedCount,
        rejectedCount: debug.rejectedCount,
        rejectionReasons: debug.rejectionReasons,
      })

      if (pools.length < effectiveMinPools) {
        failures.push({ source: sourceType, error: `min_pools:${pools.length}` })
        continue
      }

      return {
        pools,
        usedSource: sourceType,
        attemptedSources,
        failures,
        debugSummary,
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
    debugSummary,
  }
}
