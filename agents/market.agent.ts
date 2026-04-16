import { ethers } from 'ethers';
import type { MarketState, Pool, Token } from '../core/types';
import config from '../config';

const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
];

const POOLS = [
  '0x16b9a8287f8c4f444f2b5d4f6f3ebc0b8f2f8f7a',
  '0x58f876857a02d6762a7c8acbaf0d4f6f4f8f2c3b',
  '0x1b96b92314c44b159149f7e0303511fb2fc4774f',
];

const provider = new ethers.JsonRpcProvider(config.rpcUrl);

async function fetchPoolState(poolAddress: string): Promise<Pool | null> {
  console.log(`Fetching pool: ${poolAddress}`);

  try {
    const pair = new ethers.Contract(poolAddress, PAIR_ABI, provider);
    const [reserves, token0Addr, token1Addr] = await Promise.all([
      pair.getReserves(),
      pair.token0(),
      pair.token1(),
    ]);

    const r0 = Number(reserves.reserve0);
    const r1 = Number(reserves.reserve1);
    if (!r0 || !r1) return null;

    const token0: Token = { address: token0Addr, symbol: 'TOKEN0' };
    const token1: Token = { address: token1Addr, symbol: 'TOKEN1' };

    return {
      address: poolAddress,
      token0,
      token1,
      price: r1 / r0,
      liquidity: r0 + r1,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Pool fetch error ${poolAddress}: ${msg}`);
    return null;
  }
}

export async function marketAgent(): Promise<MarketState> {
  const pools: Pool[] = [];

  for (const addr of POOLS) {
    const pool = await fetchPoolState(addr);
    if (!pool) continue;
    pools.push(pool);
  }

  return {
    pools,
    timestamp: Date.now(),
  };
}
