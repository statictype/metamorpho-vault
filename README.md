# MetaMorpho Vault — 3F x Steakhouse USDC

A single-page deposit & withdrawal interface for the [3F x Steakhouse USDC MetaMorpho vault](https://etherscan.io/address/0xBEEf3f3A04e28895f3D5163d910474901981183D) on Ethereum mainnet.

## Stack

- **Next.js 16** (App Router, TypeScript strict, React Compiler)
- **Wagmi v3 + Viem** — on-chain reads & EIP-5792 batched writes via `useSendCalls`
- **RainbowKit** — wallet connection
- **TanStack Query** — data fetching & caching
- **Recharts** — share price chart (code-split via `next/dynamic`)
- **Tailwind CSS v4** — styling
- **Vitest** — unit tests

## Quick Start (Local Development with Anvil)

### Prerequisites

1. **Node.js 20+** and **pnpm**
2. **Foundry** (for Anvil local fork):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash && foundryup
   ```
3. **Alchemy API key** (free tier): sign up at [alchemy.com](https://www.alchemy.com/), create an Ethereum mainnet app

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Alchemy API key

# 3. Start Anvil fork (in a separate terminal — reads key from .env.local)
./scripts/start-anvil.sh

# 4. Fund dev wallet with USDC
./scripts/fund-dev-wallet.sh

# 5. Start the app
pnpm dev
```

### Wallet Setup

1. Import Anvil's default account #0 into MetaMask:
   - Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
2. Point MetaMask's Ethereum Mainnet to Anvil:
   - Go to **Settings → Networks → Ethereum Mainnet**
   - Change the RPC URL to `http://127.0.0.1:8545`
   - (Remember to revert this when done testing)
3. Add USDC token: **Import Tokens** → paste `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
4. Connect via RainbowKit in the app

## Production Mode

Set `NEXT_PUBLIC_RPC_URL` to your Alchemy mainnet URL:

```
NEXT_PUBLIC_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<your-key>
```

## Architecture

### Data Sources

| Data | Source | Refresh |
|------|--------|---------|
| TVL (raw), Total Supply | On-chain `totalAssets()`, `totalSupply()` | 12s |
| TVL (USD), APY, Liquidity | Morpho API | 30s |
| Share Price History | Morpho API `historicalState` | 5min |
| Market Allocations | Morpho API `caps` | 60s |
| USDC Balance, Allowance, Vault Shares | On-chain (batched multicall) | 12s |

User-specific reads (USDC balance, allowance, vault shares) are batched into a single `useReadContracts` multicall. The user's asset position is computed client-side using the ERC-4626 formula (`shares * totalAssets / totalSupply`) rather than a separate `convertToAssets` RPC call, since `totalAssets` and `totalSupply` are already cached.

All on-chain queries use `staleTime` equal to `refetchInterval` to prevent re-renders (e.g. from API responses) from triggering early refetches. Queries also refetch on window focus.

### Cache Invalidation

After transactions, only the specific queries affected are invalidated using wagmi's `readContractsQueryKey` prefix matching and TanStack Query keys:

- **Deposit**: user data (balance, allowance, shares), vault totals, API data (TVL, allocations)
- **Withdraw**: user data (balance, shares), vault totals, API data (TVL, allocations)
- Share price history is **not** invalidated (transactions don't affect historical data).

### Transaction Flow

All write transactions use `useSendCalls` (EIP-5792) with `experimental_fallback: true` for EOA compatibility.

- **Deposit**: Checks USDC allowance → if insufficient, batches `approve` + `deposit` into a single `sendCalls` invocation. If sufficient, sends only `deposit`. Confirmation tracked via `useCallsStatus` polling.
- **Withdraw**: Converts input USDC amount to shares proportionally → sends `redeem` via `sendCalls`.
- **Toast lifecycle**: pending (wallet signing) → confirming (on-chain) → confirmed or failed.

### Server/Client Boundaries

- `layout.tsx` and `page.tsx` are Server Components (metadata, fonts, CSS delivered in initial HTML)
- Providers (wagmi, RainbowKit, TanStack Query) are dynamically imported with `ssr: false` to avoid WalletConnect's `indexedDB` SSR error, with a server-rendered skeleton fallback for instant page shell
- `VaultPage` is a Server Component composing client leaf components
- Recharts is code-split via `next/dynamic` with `ssr: false`

### Error Handling

- **RPC failure**: Stat cards show "---" with a Retry button
- **API down**: Chart and allocations show "Data unavailable" placeholder
- **User rejects tx**: Detects rejection, shows "Transaction rejected" toast
- **Insufficient balance**: Button disabled with validation message
- **Wrong network**: RainbowKit shows "Wrong Network" button

## Vault Details

- **Vault**: 3F x Steakhouse USDC MetaMorpho
- **Address**: `0xBEEf3f3A04e28895f3D5163d910474901981183D`
- **Asset**: USDC (`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`, 6 decimals)
- **Standard**: ERC-4626 (tokenized vault)
- **Why this vault**: It's the 3F Labs flagship vault, making it the natural choice for this assessment.

## Bonus Features

- **Market Allocations**: Shows which Morpho Blue markets the vault lends into, with USD amounts and percentage bars. Fetched from the Morpho V2 API `caps` field, handling both `MarketV1CapData` and `AdapterCapData` union types.

## Trade-offs & Decisions

- **`useSendCalls` with `experimental_fallback`**: EIP-5792 batching for smart wallet compatibility (EIP-7702). The fallback ensures EOA wallets gracefully degrade to sequential transactions.
- **Client-side `convertToAssets`**: Computes the ERC-4626 formula locally instead of an extra RPC call, since `totalAssets`/`totalSupply` are already fetched. Eliminates a request waterfall.
- **Batched user reads**: USDC balance, allowance, and vault shares in a single multicall instead of three separate RPC calls.
- **Morpho V2 API** for off-chain data (APY, liquidity, historical share prices) vs computing everything on-chain: Better UX with less RPC load.
- **React Compiler** enabled — no manual memoization (`useMemo`/`useCallback`), the compiler handles it automatically.
- **Dark theme only**: Matches the Morpho/DeFi aesthetic and simplifies the design.
- **No server components for data**: All vault data is client-side fetched since it depends on wallet state and needs frequent refreshes.
- **Tested on Anvil fork only**: Deposit and withdrawal flows were tested against a local Anvil mainnet fork with funded dev wallets. Not tested with real assets on mainnet.
