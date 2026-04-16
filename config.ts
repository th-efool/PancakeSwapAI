import fs from 'fs'
import path from 'path'
import type { DataSourceType } from './core/market-data/data-source.interface.js'
import type { Config } from './core/types.js'

type AppConfig = Config & {
  chainId: number
  routerType: 'smart' | 'universal'
  pollIntervalMs: number
  dataSource: DataSourceType
  marketData: {
    fallbackOrder: DataSourceType[]
    timeoutMs: number
    minPools: number
  }
}

const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/'
const BSC_CHAIN_ID = 56
const DEFAULT_GAS_LIMIT = 300000
const DEFAULT_SLIPPAGE_TOLERANCE = 0.005
const DEFAULT_MAX_TRADE_SIZE = 0.05
const DEFAULT_ROUTER_TYPE: AppConfig['routerType'] = 'smart'
const DEFAULT_POLL_INTERVAL_MS = 5000
const DEFAULT_DATA_SOURCE: DataSourceType = 'ON_CHAIN'
const ALL_SOURCES: DataSourceType[] = ['ON_CHAIN', 'DEXSCREENER', 'SUBGRAPH']

export const config: AppConfig = {
  rpcUrl: BSC_RPC_URL,
  chainId: BSC_CHAIN_ID,
  privateKey: process.env.PRIVATE_KEY || '',
  gasLimit: DEFAULT_GAS_LIMIT,
  slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
  maxTradeSize: DEFAULT_MAX_TRADE_SIZE,
  routerType: DEFAULT_ROUTER_TYPE,
  pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
  dataSource: (process.env.MARKET_DATA_SOURCE as DataSourceType) || DEFAULT_DATA_SOURCE,
  marketData: {
    fallbackOrder: ['ON_CHAIN', 'DEXSCREENER', 'SUBGRAPH'],
    timeoutMs: 8000,
    minPools: 3,
  },
}

function isSource(v: unknown): v is DataSourceType {
  return typeof v === 'string' && ALL_SOURCES.includes(v as DataSourceType)
}

export function setMarketDataConfig(next: { dataSource?: DataSourceType; fallbackOrder?: DataSourceType[] }) {
  if (next.dataSource && isSource(next.dataSource)) config.dataSource = next.dataSource
  if (next.fallbackOrder?.length) {
    const clean = next.fallbackOrder.filter((v) => isSource(v))
    config.marketData.fallbackOrder = clean.length ? clean : ['ON_CHAIN', 'DEXSCREENER', 'SUBGRAPH']
  }
}

export function syncMarketDataConfigFromDisk() {
  const files = ['dashboard/public/market_data_config.json', 'public/market_data_config.json']
  for (const file of files) {
    const abs = path.resolve(process.cwd(), file)
    if (!fs.existsSync(abs)) continue
    try {
      const json = JSON.parse(fs.readFileSync(abs, 'utf-8'))
      setMarketDataConfig({
        dataSource: json?.dataSource,
        fallbackOrder: Array.isArray(json?.fallbackOrder) ? json.fallbackOrder : undefined,
      })
      return
    } catch {
      continue
    }
  }
}

export function estimateGasCost(): number {
  return config.gasLimit * 1e-9
}

export default config
