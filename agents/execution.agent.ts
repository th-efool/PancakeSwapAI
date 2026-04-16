import { ethers } from 'ethers';
import type { Opportunity, TradeResult } from '../core/types';
import config from '../config';

const DRY_RUN = true;

type SwapRequest = {
  to: string;
  data: string;
  value: bigint;
  gasLimit?: bigint;
};

function applySlippage(amount: number): number {
  return amount * (1 - config.slippageTolerance);
}

function buildSwapRequest(opp: Opportunity): SwapRequest {
  const minOut = applySlippage(opp.expectedProfit);
  const route = config.routerType === 'smart' ? 'SMART' : 'UNIVERSAL';
  const payload = `route=${route};buy=${opp.buyPool.address};sell=${opp.sellPool.address};minOut=${minOut}`;
  return {
    to: config.routerType === 'smart' ? opp.buyPool.address : opp.sellPool.address,
    data: ethers.hexlify(ethers.toUtf8Bytes(payload)),
    value: 0n,
  };
}

async function estimateGas(provider: ethers.JsonRpcProvider, req: SwapRequest): Promise<bigint> {
  try {
    return await provider.estimateGas({ to: req.to, data: req.data, value: req.value });
  } catch {
    return BigInt(config.gasLimit);
  }
}

export async function executionAgent(opp: Opportunity): Promise<TradeResult> {
  if (!opp.buyPool || !opp.sellPool) return { success: false, error: 'Invalid opportunity pools' };
  if (opp.expectedProfit <= 0) return { success: false, error: 'Non-profitable opportunity' };

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const req = buildSwapRequest(opp);

  console.log(`Router selected: ${config.routerType}`);
  req.gasLimit = await estimateGas(provider, req);
  console.log(`Estimated gas: ${req.gasLimit.toString()}`);

  if (DRY_RUN) {
    console.log('Execution mode: DRY_RUN');
    console.log(`Swap request -> to: ${req.to}`);
    return { success: true, txHash: 'dry-run', actualProfit: opp.expectedProfit };
  }

  if (!config.privateKey) return { success: false, error: 'Missing PRIVATE_KEY for live execution' };

  try {
    console.log('Execution mode: LIVE');
    const wallet = new ethers.Wallet(config.privateKey, provider);
    const tx = await wallet.sendTransaction({
      to: req.to,
      data: req.data,
      value: req.value,
      gasLimit: req.gasLimit,
    });
    const receipt = await tx.wait();
    if (!receipt) return { success: false, error: 'No transaction receipt' };
    return { success: true, txHash: tx.hash };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Execution error: ${msg}`);
    return { success: false, error: msg };
  }
}

export default executionAgent;
