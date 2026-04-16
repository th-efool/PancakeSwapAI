export type Token = {
  address: string;
  symbol: string;
};

export type Pool = {
  address: string;
  token0: Token;
  token1: Token;
  price: number;
  liquidity: number;
};

export type MarketState = {
  pools: Pool[];
  timestamp: number;
};

export type Opportunity = {
  buyPool: Pool;
  sellPool: Pool;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: number;
  expectedProfit: number;
  gasCost: number;
  slippage: number;
  strategy: string;
  confidence: number;
  score?: number;
};

export type TradeResult = {
  success: boolean;
  txHash?: string;
  actualProfit?: number;
  error?: string;
};

export type Config = {
  rpcUrl: string;
  privateKey: string;
  gasLimit: number;
  slippageTolerance: number;
  maxTradeSize: number;
};
