// Token metadata used by pools and routing.
export type Token = {
  address: string;
  symbol: string;
};

// Liquidity pool snapshot for a token pair.
export type Pool = {
  address: string;
  token0: Token;
  token1: Token;
  price: number;
  liquidity: number;
};

// Market snapshot across tracked pools.
export type MarketState = {
  pools: Pool[];
  timestamp: number;
};

// Candidate cross-pool trade with projected costs.
export type Opportunity = {
  buyPool: Pool;
  sellPool: Pool;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: number;
  expectedProfit: number;
  gasCost: number;
  slippage: number;
};

// Trade execution outcome and optional diagnostics.
export type TradeResult = {
  success: boolean;
  txHash?: string;
  actualProfit?: number;
  error?: string;
};

// Runtime settings for execution and risk limits.
export type Config = {
  rpcUrl: string;
  privateKey: string;
  gasLimit: number;
  slippageTolerance: number;
  maxTradeSize: number;
};
