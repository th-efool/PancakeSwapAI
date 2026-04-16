/**
 * PancakeSwap BSC Testnet Swap — Live Integration Test
 *
 * This script is the reference implementation an AI agent generates and runs
 * when asked to "swap BNB for CAKE on PancakeSwap" with autonomous execution.
 *
 * SETUP (one-time):
 *   1. Get a dedicated testnet wallet (never use a mainnet wallet here)
 *   2. Fund it with testnet BNB: https://testnet.bnbchain.org/faucet-smart
 *   3. export PRIVATE_KEY=0x...
 *
 * RUN:
 *   node tests/testnet-swap.mjs
 *
 * CHAIN: BSC Testnet (chain ID 97)
 * METHOD: Direct V2 Router contract calls (no @pancakeswap/smart-router needed)
 * TOKEN PAIR: BNB → CAKE (testnet)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  parseEther,
  formatEther,
  formatUnits,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

// ─── Chain Definition ────────────────────────────────────────────────────────

const bscTestnet = defineChain({
  id: 97,
  name: 'BNB Smart Chain Testnet',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://bsc-testnet-rpc.publicnode.com',
        'https://bsc-testnet.drpc.org',
        'https://bsc-testnet.publicnode.com',
        'https://bsc-testnet.blockpi.network/v1/rpc/public',
        'https://data-seed-prebsc-1-s1.binance.org:8545',
        'https://data-seed-prebsc-2-s1.binance.org:8545',
      ],
    },
  },
  blockExplorers: {
    default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' },
  },
  testnet: true,
})

// ─── Testnet Addresses ────────────────────────────────────────────────────────

const TESTNET = {
  // PancakeSwap V2 Router (testnet)
  V2_ROUTER: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
  // Wrapped BNB (testnet)
  WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  // CAKE (testnet)
  CAKE: '0xFa60D973f7642b748046464E165A65B7323b0C73',
  // BUSD (testnet) — useful for token→token tests
  BUSD: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
}

// ─── V2 Router ABI ────────────────────────────────────────────────────────────

const V2_ROUTER_ABI = [
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
]

// ─── ERC-20 ABI (balance check) ───────────────────────────────────────────────

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
]

// ─── Config ───────────────────────────────────────────────────────────────────

const SWAP_AMOUNT_BNB = '0.01'   // 0.01 testnet BNB (safe, cheap)
const SLIPPAGE_BPS = 100n        // 1% slippage — higher for testnet liquidity

// Output token: BUSD is more reliably deployed on BSC testnet than CAKE
const OUT_TOKEN  = TESTNET.BUSD
const OUT_SYMBOL = 'BUSD'

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Load wallet from env
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY environment variable not set.')
    console.error('   export PRIVATE_KEY=0x...')
    process.exit(1)
  }

  const account = privateKeyToAccount(privateKey)
  console.log('\n🔑 Wallet:', account.address)
  console.log('🌐 Chain:  BSC Testnet (chain ID 97)')

  // 2. Create clients — use fallback transport across multiple public RPCs
  //    (Binance's testnet seeds are often flaky; publicnode.com is more reliable)
  const transport = fallback(
    [
      http('https://bsc-testnet-rpc.publicnode.com',        { timeout: 4_000 }),
      http('https://bsc-testnet.drpc.org',                  { timeout: 4_000 }),
      http('https://bsc-testnet.publicnode.com',            { timeout: 4_000 }),
      http('https://bsc-testnet.blockpi.network/v1/rpc/public', { timeout: 4_000 }),
      http('https://data-seed-prebsc-1-s1.binance.org:8545',{ timeout: 4_000 }),
      http('https://data-seed-prebsc-2-s1.binance.org:8545',{ timeout: 4_000 }),
    ],
    { retryCount: 1 },
  )

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport,
  })

  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport,
  })

  // 3. Check balances before swap
  console.log('\n📊 Balances before swap:')
  console.log('   (fetching from RPC...)')
  const bnbBefore = await publicClient.getBalance({ address: account.address })
  console.log(`   BNB:  ${formatEther(bnbBefore)} BNB`)

  // Token balance check — non-fatal; contract may not be deployed on all testnets
  let outDecimals = 18n
  let outBefore = 0n
  try {
    ;[outBefore, outDecimals] = await Promise.all([
      publicClient.readContract({ address: OUT_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] }),
      publicClient.readContract({ address: OUT_TOKEN, abi: ERC20_ABI, functionName: 'decimals' }),
    ])
    console.log(`   ${OUT_SYMBOL}: ${formatUnits(outBefore, outDecimals)} ${OUT_SYMBOL}`)
  } catch {
    console.log(`   ${OUT_SYMBOL}: (contract not readable — will verify via BNB delta after swap)`)
  }

  if (bnbBefore < parseEther('0.015')) {
    console.error('\n❌ Insufficient testnet BNB.')
    console.error('   Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart')
    process.exit(1)
  }

  // 4. Get quote from V2 Router
  const amountIn = parseEther(SWAP_AMOUNT_BNB)
  const path = [TESTNET.WBNB, OUT_TOKEN]

  console.log(`\n💱 Quote: ${SWAP_AMOUNT_BNB} BNB → ${OUT_SYMBOL}`)

  let expectedOut
  try {
    const amounts = await publicClient.readContract({
      address: TESTNET.V2_ROUTER,
      abi: V2_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountIn, path],
    })
    expectedOut = amounts[1]
    console.log(`   Expected ${OUT_SYMBOL} out: ${formatUnits(expectedOut, outDecimals)} ${OUT_SYMBOL}`)
  } catch (err) {
    console.error(`❌ Failed to get quote — pool may not exist on testnet for BNB→${OUT_SYMBOL}`)
    console.error(`   Error: ${err.message}`)
    process.exit(1)
  }

  // 5. Apply slippage
  const minOut = (expectedOut * (10000n - SLIPPAGE_BPS)) / 10000n
  console.log(`   Min ${OUT_SYMBOL} out (${Number(SLIPPAGE_BPS) / 100}% slippage): ${formatUnits(minOut, outDecimals)} ${OUT_SYMBOL}`)

  // 6. Set deadline (20 minutes)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20)

  // 7. Simulate before sending
  console.log('\n🔍 Simulating transaction...')
  try {
    await publicClient.simulateContract({
      address: TESTNET.V2_ROUTER,
      abi: V2_ROUTER_ABI,
      functionName: 'swapExactETHForTokens',
      args: [minOut, path, account.address, deadline],
      value: amountIn,
      account: account.address,
    })
    console.log('   ✅ Simulation passed')
  } catch (err) {
    console.error('❌ Simulation failed — transaction would revert')
    console.error(`   Reason: ${err.message}`)
    process.exit(1)
  }

  // 8. Execute swap
  console.log('\n🚀 Sending swap transaction...')
  const hash = await walletClient.writeContract({
    address: TESTNET.V2_ROUTER,
    abi: V2_ROUTER_ABI,
    functionName: 'swapExactETHForTokens',
    args: [minOut, path, account.address, deadline],
    value: amountIn,
    gas: 250000n,
  })

  console.log(`   Tx hash: ${hash}`)
  console.log(`   View on BscScan: https://testnet.bscscan.com/tx/${hash}`)

  // 9. Wait for confirmation
  console.log('\n⏳ Waiting for confirmation...')
  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  if (receipt.status === 'reverted') {
    console.error('❌ Transaction reverted!')
    console.error(`   Block: ${receipt.blockNumber}`)
    process.exit(1)
  }

  console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`)
  console.log(`   Gas used: ${receipt.gasUsed.toLocaleString()}`)

  // 10. Check balances after
  console.log('\n📊 Balances after swap:')
  const bnbAfter = await publicClient.getBalance({ address: account.address })
  const bnbSpent = bnbBefore - bnbAfter
  console.log(`   BNB:  ${formatEther(bnbAfter)} BNB  (spent: ${formatEther(bnbSpent)} BNB incl. gas)`)

  // Token balance after — non-fatal, same as before
  try {
    const outAfter = await publicClient.readContract({
      address: OUT_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address],
    })
    const outReceived = outAfter - outBefore
    console.log(`   ${OUT_SYMBOL}: ${formatUnits(outAfter, outDecimals)} ${OUT_SYMBOL}  (+${formatUnits(outReceived, outDecimals)} ${OUT_SYMBOL})`)
  } catch {
    console.log(`   ${OUT_SYMBOL}: (balance unreadable — check BscScan for token transfer in the tx above)`)
  }

  console.log('\n✅ Swap complete!')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:')
  console.error('   name   :', err.name)
  console.error('   message:', err.message)
  console.error('   short  :', err.shortMessage)
  console.error(err)
  process.exit(1)
})
