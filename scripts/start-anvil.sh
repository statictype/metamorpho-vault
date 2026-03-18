#!/bin/bash
# Start Anvil forking Ethereum mainnet via Alchemy
# Requires: Foundry installed (curl -L https://foundry.paradigm.xyz | bash && foundryup)

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Source .env.local to load all env vars
if [ -f "$SCRIPT_DIR/.env.local" ]; then
  set -a
  source "$SCRIPT_DIR/.env.local"
  set +a
fi

API_KEY="${ALCHEMY_API_KEY:-$NEXT_PUBLIC_ALCHEMY_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "Error: Set ALCHEMY_API_KEY or add NEXT_PUBLIC_ALCHEMY_API_KEY to .env.local"
  exit 1
fi

echo "Starting Anvil fork of Ethereum mainnet..."
anvil --fork-url "https://eth-mainnet.g.alchemy.com/v2/$API_KEY" --chain-id 1
