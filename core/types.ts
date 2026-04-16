export type MarketRegime = 'TRENDING' | 'MEAN_REVERTING' | 'VOLATILE' | 'CHAOTIC' | 'IDLE' | 'UNKNOWN'

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
  priceChange: {
    m5: number;
    h1: number;
  };
  volume: {
    m5: number;
    h1: number;
  };
  txns: {
    m5: {
      buys: number;
      sells: number;
      total: number;
    };
  };
};

export type MarketSignal = {
  momentum: number
  higherTFMomentum: number
  volumeSpike: number
  orderImbalance: number
  liquidityWeight: number
  signalStrength: number
}

export type SignalSet = {
  perPool: Array<{ poolAddress: string; signal: MarketSignal }>
  aggregate: MarketSignal
}

export type RegimeAssessment = {
  regime: MarketRegime
  confidence: number
  reason: string
}

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
  signalStrength?: number;
  reason?: string;
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
