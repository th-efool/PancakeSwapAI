import { Contract, JsonRpcProvider, formatUnits, getAddress } from 'ethers'
import type { Token } from '../types'
import type {
  DataSource,
  DataSourceType,
  DexScreenerRawPool,
  FetchContext,
  OnChainRawPool,
  RawPool,
  SubgraphRawPool,
} from './data-source.interface'

const PRIMARY_RPC = process.env.BSC_RPC_URL || 'https://bsc-rpc.publicnode.com'
const FALLBACK_RPCS = ['https://bsc-dataseed.bnbchain.org', 'https://rpc.ankr.com/bsc']

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

    for (const p of TARGET_POOLS) {
      if (invalidPools.has(p.address)) continue
      try {
        const code = await provider.getCode(p.address)
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
        const [r0, r1] = (await pair.getReserves()) as [bigint, bigint, number]
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
      } catch {
        invalidPools.add(p.address)
      }
    }

    return pools
  }
}

class DexScreenerDataSource implements DataSource {
  type: DataSourceType = 'DEXSCREENER'

  async fetchPools(_: FetchContext): Promise<RawPool[]> {
    const rows: DexScreenerRawPool[] = []
    return rows
  }
}

class SubgraphDataSource implements DataSource {
  type: DataSourceType = 'SUBGRAPH'

  async fetchPools(_: FetchContext): Promise<RawPool[]> {
    const rows: SubgraphRawPool[] = []
    return rows
  }
}

export function createDataSource(type: DataSourceType): DataSource {
  if (type === 'ON_CHAIN') return new OnChainDataSource()
  if (type === 'DEXSCREENER') return new DexScreenerDataSource()
  return new SubgraphDataSource()
}

export { TARGET_POOLS }
