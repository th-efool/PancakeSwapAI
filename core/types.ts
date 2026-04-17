import type { MarketRegime } from '../shared/market.js'

export type { MarketRegime }

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
  temporal: {
    priceDelta: number
    velocity: number
    volatility: number
  }
  source: 'cross_pool' | 'temporal' | 'hybrid' | 'none'
  poolCount: number
  historyLength: number
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
  volatility?: number;
  signalStrength?: number;
  reason?: string;
  executionReason?: 'standard' | 'bootstrap';
  score?: number;
};

export type EvaluatedStrategy = {
  name: string
  expectedProfit: number
  confidence: number
  score: number
  selected: boolean
}

export type TradeResult = {
  success: boolean;
  txHash?: string;
  error?: string;
  actualProfit?: number;
};

export type Performance = {
  totalTrades: number;
  totalTradesExecuted: number;
  successfulTrades: number;
  winRate: number;
  totalProfit: number;
  totalGasSpent: number;
  netProfit: number;
  totalOpportunitiesSeen: number;
  totalRejected: number;
  rejectedOpportunities: number;
  conversionRate: number;
  selectivity: number;
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
  strategyUsage: Record<string, number>;
};

export type Config = {
  rpcUrl: string;
  privateKey: string;
  gasLimit: number;
  gasPriceGwei: number;
  slippageTolerance: number;
  minProfitThreshold: number;
  maxTradeSize: number;
  tradeScaleK: number;
  minTradeSize: number;
  volatilityEpsilon: number;
  noiseEnabled: boolean;
  noiseSigmaPrice: number;
  noiseSigmaVelocity: number;
  noiseSeed?: number;
};
