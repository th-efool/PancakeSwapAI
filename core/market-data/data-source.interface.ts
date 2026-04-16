import type { Token } from '../types'

export type DataSourceType = 'ON_CHAIN' | 'DEXSCREENER' | 'SUBGRAPH'

export type FetchContext = {
  now: number
}

type RawPoolBase = {
  source: DataSourceType
  address: string
  token0: Token
  token1: Token
}

export type OnChainRawPool = RawPoolBase & {
  source: 'ON_CHAIN'
  reserve0: number
  reserve1: number
}

export type DexScreenerRawPool = RawPoolBase & {
  source: 'DEXSCREENER'
  priceUsd: number
  liquidityUsd: number
  priceChangeM5: number
  priceChangeH1: number
  volumeM5: number
  volumeH1: number
  buysM5: number
  sellsM5: number
}

export type SubgraphRawPool = RawPoolBase & {
  source: 'SUBGRAPH'
  token0Price: number
  token1Price: number
  totalValueLockedUSD: number
}

export type RawPool = OnChainRawPool | DexScreenerRawPool | SubgraphRawPool

export interface DataSource {
  type: DataSourceType
  fetchPools(ctx: FetchContext): Promise<RawPool[]>
}
