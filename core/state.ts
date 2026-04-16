import type { Opportunity, Performance } from './types';

export let latestState: {
  opportunity: Opportunity | null;
  performance: Performance | null;
} = {
  opportunity: null,
  performance: null,
};
