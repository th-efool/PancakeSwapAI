import { Contract, JsonRpcProvider, formatUnits, getAddress } from 'ethers'
import { log } from '../logger.js'
import type { Token } from '../types.js'
import type {
  DataSource,
  DataSourceType,
  DexScreenerRawPool,
  FetchContext,
  OnChainRawPool,
  RawPool,
  SubgraphRawPool,
} from './data-source.interface.js'

const PRIMARY_RPC = process.env.BSC_RPC_URL || 'https://bsc-rpc.publicnode.com'
const FALLBACK_RPCS = ['https://bsc-dataseed.bnbchain.org', 'https://rpc.ankr.com/bsc']
const DEXSCREENER_API_BASE = 'https://api.dexscreener.com/latest/dex/pairs/bsc'
const SUBGRAPH_API_URL =
  process.env.PANCAKESWAP_SUBGRAPH_URL || 'https://thegraph.com/hosted-service/subgraph/pancakeswap/exchange-v3-bsc'

const PAIR_ABI = ['function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)']
const PAIR_VALIDATION_ABI = ['function token0() view returns (address)', 'function token1() view returns (address)']
const invalidPools = new Set<string>()

const WBNB: Token = {
  address: getAddress('0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'),
  symbol: 'WBNB',
}

const USDT: Token = {
  address: getAddress('0x55d398326f99059ff775485246999027b3197955'),
  symbol: 'USDT',
}

const BUSD: Token = {
  address: getAddress('0xe9e7cea3dedca5984780bafc599bd69add087d56'),
  symbol: 'BUSD',
}

const CAKE: Token = {
  address: getAddress('0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'),
  symbol: 'CAKE',
}

const TARGET_POOLS: Array<{ address: string; token0: Token; token1: Token }> = [
  {
    address: getAddress('0x16b9a82891338f9ba80e2d6970fdda79d1eb0dae'),
    token0: WBNB,
    token1: USDT,
  },
  {
    address: getAddress('0x58f876857a02d6762e0101bb5c46a8c1ed44dc16'),
    token0: WBNB,
    token1: BUSD,
  },
  {
    address: getAddress('0x0ed7e52944161450477ee417de9cd3a859b14fd0'),
    token0: CAKE,
    token1: WBNB,
  },
]

type DexScreenerPair = {
  pairAddress?: string
  baseToken?: { address?: string; symbol?: string }
  quoteToken?: { address?: string; symbol?: string }
  priceUsd?: string
  priceNative?: string
  liquidity?: { usd?: number }
  priceChange?: { m5?: number; h1?: number }
  volume?: { m5?: number; h1?: number }
  txns?: { m5?: { buys?: number; sells?: number } }
}

type SubgraphPool = {
  id: string
  token0?: { id?: string; symbol?: string }
  token1?: { id?: string; symbol?: string }
  token0Price?: string
  token1Price?: string
  totalValueLockedUSD?: string
}

function toToken(value: { address?: string; symbol?: string } | undefined, fallback: Token): Token {
  const address = value?.address
  if (!address) return fallback

  try {
    return {
      address: getAddress(address),
      symbol: value?.symbol || fallback.symbol,
    }
  } catch {
    return fallback
  }
}

class OnChainDataSource implements DataSource {
  type: DataSourceType = 'ON_CHAIN'

  private async getProvider(): Promise<JsonRpcProvider | null> {
    const urls = [PRIMARY_RPC, ...FALLBACK_RPCS]
    for (const url of urls) {
      const provider = new JsonRpcProvider(url)
      try {
        await provider.getBlockNumber()
        return provider
      } catch (e) {
        console.error('RPC failed:', url, e)
      }
    }
    return null
  }

  async fetchPools(_: FetchContext): Promise<RawPool[]> {
    const provider = await this.getProvider()
    if (!provider) return []

    const pools: OnChainRawPool[] = []
    const poolsToCheck = TARGET_POOLS.slice(0, 1)

    for (const p of poolsToCheck) {
      if (invalidPools.has(p.address)) continue
      try {
        const code = await provider.getCode(p.address)
        console.log('[ON_CHAIN] getCode', { address: p.address, code })
        if (code === '0x') {
          invalidPools.add(p.address)
          continue
        }

        const validator = new Contract(p.address, PAIR_VALIDATION_ABI, provider)
        try {
          await Promise.all([validator.token0(), validator.token1()])
        } catch {
          invalidPools.add(p.address)
          continue
        }

        const pair = new Contract(p.address, PAIR_ABI, provider)
        const reserves = (await pair.getReserves()) as [bigint, bigint, number]
        console.log('[ON_CHAIN] getReserves raw', { address: p.address, reserves })
        const [r0, r1] = reserves
        const reserve0 = Number(formatUnits(r0, 18))
        const reserve1 = Number(formatUnits(r1, 18))
        if (!Number.isFinite(reserve0) || !Number.isFinite(reserve1) || reserve0 <= 0 || reserve1 <= 0) continue

        pools.push({
          source: 'ON_CHAIN',
          address: p.address,
          token0: p.token0,
          token1: p.token1,
          reserve0,
          reserve1,
        })
      } catch (error) {
        console.error('[ON_CHAIN] pool fetch failed', { address: p.address, error })
        invalidPools.add(p.address)
      }
    }

    console.log('[ON_CHAIN] raw response length', pools.length)
    console.log('[ON_CHAIN] sample item', pools[0] ?? null)
    log('market', `[ON_CHAIN] raw response length=${pools.length}`)

    return pools
  }
}

class DexScreenerDataSource implements DataSource {
  type: DataSourceType = 'DEXSCREENER'

  async fetchPools(_: FetchContext): Promise<RawPool[]> {
    log('market', 'Using DexScreener temporal data')
    const pairAddresses = TARGET_POOLS.map((pool) => pool.address.toLowerCase()).join(',')
    const url = `${DEXSCREENER_API_BASE}/${pairAddresses}`
    console.log('[DEXSCREENER] full API URL', url)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`dexscreener_http_${response.status}`)
    }

    const payload = (await response.json()) as { pairs?: DexScreenerPair[] }
    const pairs = Array.isArray(payload?.pairs) ? payload.pairs : []
    console.log('[DEXSCREENER] response.pairs.length', pairs.length)
    console.log('[DEXSCREENER] first pair object', pairs[0] ?? null)
    console.log('[DEXSCREENER] raw response length', pairs.length)
    console.log('[DEXSCREENER] sample item', pairs[0] ?? null)

    const rows: DexScreenerRawPool[] = []
    for (const pair of pairs) {
      const fallbackPool = TARGET_POOLS.find((pool) => pool.address.toLowerCase() === pair.pairAddress?.toLowerCase()) ?? TARGET_POOLS[0]
      const price = parseFloat(pair.priceUsd || pair.priceNative || '')
      const liquidity = pair.liquidity?.usd

      if (pair.priceUsd === undefined && pair.priceNative === undefined) {
        console.error('[DEXSCREENER] price mapping undefined', { pairAddress: pair.pairAddress, pair })
      }

      if (liquidity === undefined) {
        console.error('[DEXSCREENER] liquidity mapping undefined', { pairAddress: pair.pairAddress, pair })
      }

      rows.push({
        source: 'DEXSCREENER',
        address: pair.pairAddress ? getAddress(pair.pairAddress) : fallbackPool.address,
        token0: toToken(pair.baseToken, fallbackPool.token0),
        token1: toToken(pair.quoteToken, fallbackPool.token1),
        priceUsd: price,
        liquidityUsd: typeof liquidity === 'number' ? liquidity : 0,
        priceChangeM5: pair.priceChange?.m5 ?? 0,
        priceChangeH1: pair.priceChange?.h1 ?? 0,
        volumeM5: pair.volume?.m5 ?? 0,
        volumeH1: pair.volume?.h1 ?? 0,
        buysM5: pair.txns?.m5?.buys ?? 0,
        sellsM5: pair.txns?.m5?.sells ?? 0,
      })
    }

    return rows
  }
}

class SubgraphDataSource implements DataSource {
  type: DataSourceType = 'SUBGRAPH'

  async fetchPools(_: FetchContext): Promise<RawPool[]> {
    const query = `
      query DebugPools {
        pools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          token0Price
          token1Price
          totalValueLockedUSD
          token0 { id symbol }
          token1 { id symbol }
        }
      }
    `

    const response = await fetch(SUBGRAPH_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error(`subgraph_http_${response.status}`)
    }

    const payload = (await response.json()) as { data?: { pools?: SubgraphPool[] }; errors?: unknown[] }
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      console.error('[SUBGRAPH] graphql errors', payload.errors)
    }

    const pools = Array.isArray(payload.data?.pools) ? payload.data.pools : []
    console.log('[SUBGRAPH] query response length', pools.length)
    console.log('[SUBGRAPH] first pool', pools[0] ?? null)
    console.log('[SUBGRAPH] raw response length', pools.length)
    console.log('[SUBGRAPH] sample item', pools[0] ?? null)

    const rows: SubgraphRawPool[] = pools.map((pool, index) => {
      const fallbackPool = TARGET_POOLS[index % TARGET_POOLS.length]
      return {
        source: 'SUBGRAPH',
        address: pool.id ? getAddress(pool.id) : fallbackPool.address,
        token0: toToken({ address: pool.token0?.id, symbol: pool.token0?.symbol }, fallbackPool.token0),
        token1: toToken({ address: pool.token1?.id, symbol: pool.token1?.symbol }, fallbackPool.token1),
        token0Price: parseFloat(pool.token0Price || '0'),
        token1Price: parseFloat(pool.token1Price || '0'),
        totalValueLockedUSD: parseFloat(pool.totalValueLockedUSD || '0'),
      }
    })

    return rows
  }
}

export function createDataSource(type: DataSourceType): DataSource {
  if (type === 'ON_CHAIN') return new OnChainDataSource()
  if (type === 'DEXSCREENER') return new DexScreenerDataSource()
  return new SubgraphDataSource()
}

export { TARGET_POOLS }
