# MetaMorpho Vault — 3F x Steakhouse USDC

A single-page deposit & withdrawal interface for the [3F x Steakhouse USDC MetaMorpho vault](https://etherscan.io/address/0xBEEf3f3A04e28895f3D5163d910474901981183D) on Ethereum mainnet.

## Stack

- **Next.js 16** (App Router, TypeScript strict)
- **Wagmi v2 + Viem** — on-chain reads & write transactions
- **RainbowKit** — wallet connection
- **TanStack Query** — data fetching & caching
- **Recharts** — share price chart
- **Tailwind CSS v4** — styling

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
# If that fails, pass the key directly:
# ALCHEMY_API_KEY=<your-key> ./scripts/start-anvil.sh

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
| TVL (raw) | On-chain `totalAssets()` | 15s |
| TVL (USD) | Morpho API `totalAssetsUsd` | 60s |
| APY | Morpho API `avgNetApy` | 60s |
| Liquidity | Morpho API `liquidityUsd` | 60s |
| Share Price History | Morpho API `historicalState` | 5min |
| User Position | On-chain `balanceOf` + `convertToAssets` | 15s |
| Allowance | On-chain ERC-20 `allowance` | 10s |

### Transaction Flow

- **Deposit**: Checks USDC allowance → if insufficient, sends `approve()` then `deposit()` as two sequential transactions → toasts for each step
- **Withdraw**: Converts input USDC amount to shares proportionally → sends `redeem()` → toast lifecycle

### Error Handling

- **RPC failure**: Stat cards show "---", wagmi auto-retries
- **API down**: Chart shows "Data unavailable" placeholder
- **User rejects tx**: Detects rejection, shows "Transaction rejected" toast
- **Insufficient balance**: Button disabled with validation message
- **Wrong network**: RainbowKit shows "Wrong Network" button

## Vault Details

- **Vault**: 3F x Steakhouse USDC MetaMorpho
- **Address**: `0xBEEf3f3A04e28895f3D5163d910474901981183D`
- **Asset**: USDC (`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`, 6 decimals)
- **Standard**: ERC-4626 (tokenized vault)

## Trade-offs & Decisions

- **Wagmi v2 `writeContractAsync`** over `useSendCalls` batch: More reliable across wallet types. `sendCalls` (EIP-5792) isn't universally supported yet, so approve + deposit are sent as sequential transactions for maximum compatibility.
- **Morpho V2 API** for off-chain data (APY, liquidity, historical share prices) vs computing everything on-chain: Better UX with less RPC load.
- **Dark theme only**: Matches the Morpho/DeFi aesthetic and simplifies the design.
- **No server components for data**: All vault data is client-side fetched since it depends on wallet state and needs frequent refreshes.
