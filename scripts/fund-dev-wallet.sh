#!/bin/bash
# Impersonate a USDC whale and send USDC to Anvil's first default account
# Run this after starting Anvil

set -e

USDC=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
WHALE=0x55FE002aefF02F77364de339a1292923A15844B8  # Circle USDC reserve
DEV_WALLET=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  # Anvil account #0
AMOUNT=1000000000000  # 1,000,000 USDC (6 decimals)
RPC_URL=${RPC_URL:-http://127.0.0.1:8545}

echo "Funding whale with ETH for gas..."

# Send ETH from Anvil account #0 to the whale so it can pay gas
ANVIL_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
cast send $WHALE --value 1ether --private-key $ANVIL_PK --rpc-url $RPC_URL

echo "Funding $DEV_WALLET with 1,000,000 USDC..."

# Impersonate the whale account on Anvil
cast rpc anvil_impersonateAccount $WHALE --rpc-url $RPC_URL

cast send $USDC "transfer(address,uint256)(bool)" $DEV_WALLET $AMOUNT \
  --from $WHALE --unlocked --rpc-url $RPC_URL

# Stop impersonating
cast rpc anvil_stopImpersonatingAccount $WHALE --rpc-url $RPC_URL

BALANCE=$(cast call $USDC "balanceOf(address)(uint256)" $DEV_WALLET --rpc-url $RPC_URL)
echo "Dev wallet USDC balance: $BALANCE (raw, 6 decimals)"
echo "Done!"
