import type { Config } from './core/types';

type AppConfig = Config & {
  chainId: number;
  routerType: 'smart' | 'universal';
  pollIntervalMs: number;
};

const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/';
const BSC_CHAIN_ID = 56;
const DEFAULT_GAS_LIMIT = 300000;
const DEFAULT_SLIPPAGE_TOLERANCE = 0.005;
const DEFAULT_MAX_TRADE_SIZE = 0.05;
const DEFAULT_ROUTER_TYPE: AppConfig['routerType'] = 'smart';
const DEFAULT_POLL_INTERVAL_MS = 5000;

export const config: AppConfig = {
  rpcUrl: BSC_RPC_URL,
  chainId: BSC_CHAIN_ID,
  privateKey: process.env.PRIVATE_KEY || '',
  gasLimit: DEFAULT_GAS_LIMIT,
  slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE,
  maxTradeSize: DEFAULT_MAX_TRADE_SIZE,
  routerType: DEFAULT_ROUTER_TYPE,
  pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
};

export function estimateGasCost(): number {
  return config.gasLimit * 1e-9;
}

export default config;
