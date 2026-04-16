import type { MarketState } from './types';

const MAX_HISTORY = 10;

export let marketHistory: MarketState[] = [];

export function pushMarketState(state: MarketState) {
  marketHistory.push(state);

  if (marketHistory.length > MAX_HISTORY) {
    marketHistory.shift();
  }
}

export function getPreviousState(): MarketState | null {
  if (marketHistory.length < 2) return null;
  return marketHistory[marketHistory.length - 2];
}
