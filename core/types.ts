export type MarketRegime = 'TRENDING' | 'MEAN_REVERTING' | 'VOLATILE' | 'UNKNOWN'

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
  priceChangeM5: number;
  volumeM5: number;
  buysM5: number;
  sellsM5: number;
  priceChangeH1?: number;
};

export type MarketState = {
  pools: Pool[];
  timestamp: number;
};

export type Opportunity = {
  tokenIn: string;
  tokenOut: string;
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
  error?: string;
  actualProfit?: number;
};

export type Performance = {
  totalTrades: number;
  successfulTrades: number;
  winRate: number;
  totalProfit: number;
  totalGasSpent: number;
  netProfit: number;
  gasEfficiency: number;
  avgProfitPerTrade: number;
  avgProfit: number;
  stdDev: number;
  sharpe: number;
  strategyBreakdown: Record<
    string,
    {
      trades: number;
      profit: number;
    }
  >;
};

export type Config = {
  rpcUrl: string;
  privateKey: string;
  gasLimit: number;
  slippageTolerance: number;
  maxTradeSize: number;
};
