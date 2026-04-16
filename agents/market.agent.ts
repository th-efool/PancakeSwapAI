import { Contract, JsonRpcProvider, formatUnits, getAddress } from 'ethers'
import { log } from '../core/logger'
import type { MarketState, Pool, Token } from '../core/types'

const PRIMARY_RPC = process.env.BSC_RPC_URL || 'https://bsc-rpc.publicnode.com'
const FALLBACK_RPCS = ['https://bsc-dataseed.bnbchain.org', 'https://rpc.ankr.com/bsc']

const PAIR_ABI = ['function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)']
const PAIR_VALIDATION_ABI = ['function token0() view returns (address)', 'function token1() view returns (address)']
const invalidPools = new Set<string>()
const loggedInvalidPools = new Set<string>()

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

async function getProvider(): Promise<JsonRpcProvider | null> {
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

async function fetchPools(): Promise<Pool[]> {
  const provider = await getProvider()
  if (!provider) return []

  const pools: Pool[] = []

  for (const p of TARGET_POOLS) {
    if (invalidPools.has(p.address)) continue
    try {
      const code = await provider.getCode(p.address)
      if (code === '0x') {
        invalidPools.add(p.address)
        if (!loggedInvalidPools.has(p.address)) {
          log('market', `Invalid pool skipped: ${p.address}`)
          loggedInvalidPools.add(p.address)
        }
        continue
      }

      const validator = new Contract(p.address, PAIR_VALIDATION_ABI, provider)
      try {
        await Promise.all([validator.token0(), validator.token1()])
      } catch {
        invalidPools.add(p.address)
        if (!loggedInvalidPools.has(p.address)) {
          log('market', `Invalid pool skipped: ${p.address}`)
          loggedInvalidPools.add(p.address)
        }
        continue
      }

      const pair = new Contract(p.address, PAIR_ABI, provider)
      let reserves: [bigint, bigint, number]
      try {
        reserves = await pair.getReserves()
      } catch {
        invalidPools.add(p.address)
        if (!loggedInvalidPools.has(p.address)) {
          log('market', `Invalid pool skipped: ${p.address}`)
          loggedInvalidPools.add(p.address)
        }
        continue
      }
      const [r0, r1] = reserves
      const n0 = Number(formatUnits(r0, 18))
      const n1 = Number(formatUnits(r1, 18))
      if (!Number.isFinite(n0) || !Number.isFinite(n1) || n0 <= 0) continue
      const price = n1 / n0
      if (!Number.isFinite(price)) continue

      const pool: Pool = {
        address: p.address,
        token0: p.token0,
        token1: p.token1,
        price,
        liquidity: n0 + n1,
      }

      pools.push(pool)
      log('market', `Fetched pool ${p.address}`)
    } catch {
      invalidPools.add(p.address)
      if (!loggedInvalidPools.has(p.address)) {
        log('market', `Invalid pool skipped: ${p.address}`)
        loggedInvalidPools.add(p.address)
      }
      continue
    }
  }

  return pools
}

export async function marketAgent(): Promise<MarketState> {
  log('market', 'Fetching pools')
  try {
    const pools = await fetchPools()
    const attempted = TARGET_POOLS.length
    const valid = pools.length
    const invalidSkipped = attempted - valid
    log('market', `Pool summary: attempted=${attempted} valid=${valid} invalid_skipped=${invalidSkipped}`)
    if (pools.length < 2) {
      return {
        pools: [],
        timestamp: Date.now(),
      }
    }
    return {
      pools,
      timestamp: Date.now(),
    }
  } catch (e) {
    console.error('Market fetch failed, fallback to empty pool list', e)
    return {
      pools: [],
      timestamp: Date.now(),
    }
  }
}

export default marketAgent
