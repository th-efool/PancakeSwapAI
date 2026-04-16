import type { MarketState, Pool, Token } from '../core/types';
const token0: Token = {
  address: '0x1111111111111111111111111111111111111111',
  symbol: 'TOKEN0',
};
const token1: Token = {
  address: '0x2222222222222222222222222222222222222222',
  symbol: 'TOKEN1',
};

const MOCK_POOLS: Pool[] = [
  {
    address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    token0,
    token1,
    price: 1,
    liquidity: 200000,
  },
  {
    address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    token0,
    token1,
    price: 1.08,
    liquidity: 220000,
  },
];

export async function marketAgent(): Promise<MarketState> {
  console.log('Fetching pools...');
  return {
    pools: MOCK_POOLS,
    timestamp: Date.now(),
  };
}

export default marketAgent;
