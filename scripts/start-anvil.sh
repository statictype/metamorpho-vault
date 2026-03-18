#!/bin/bash
# Start Anvil forking Ethereum mainnet via Alchemy
# Requires: Foundry installed (curl -L https://foundry.paradigm.xyz | bash && foundryup)

set -e

if [ -z "$ALCHEMY_API_KEY" ]; then
  # Try to read from .env.local
  if [ -f .env.local ]; then
    ALCHEMY_API_KEY=$(grep NEXT_PUBLIC_ALCHEMY_API_KEY .env.local | cut -d '=' -f2)
  fi
fi

if [ -z "$ALCHEMY_API_KEY" ]; then
  echo "Error: Set ALCHEMY_API_KEY or add NEXT_PUBLIC_ALCHEMY_API_KEY to .env.local"
  exit 1
fi

echo "Starting Anvil fork of Ethereum mainnet..."
anvil --fork-url "https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY" --chain-id 1
