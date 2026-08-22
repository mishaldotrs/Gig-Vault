#!/usr/bin/env bash
# Deploys the GigVault contract to Stellar Testnet, initializes it with an
# admin/arbitrator/escrow-token, and writes the resulting contract ID into
# the frontend config (lib/contract/contract-ids.json + .env.local).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="testnet"
WASM_PATH="$ROOT_DIR/contracts/target/wasm32v1-none/release/gigvault.optimized.wasm"
if [ ! -f "$WASM_PATH" ]; then
  WASM_PATH="$ROOT_DIR/contracts/target/wasm32-unknown-unknown/release/gigvault.optimized.wasm"
fi

if [ ! -f "$WASM_PATH" ]; then
  echo "wasm not found — run scripts/build.sh first"
  exit 1
fi

ADMIN=${GIGVAULT_ADMIN_IDENTITY:-gigvault-admin}
ARBITRATOR=${GIGVAULT_ARBITRATOR_IDENTITY:-gigvault-arbitrator}

echo "==> Deploying gigvault.wasm to $NETWORK using identity '$ADMIN'"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$ADMIN" \
  --network "$NETWORK" \
  --alias gigvault)

echo "==> Deployed contract: $CONTRACT_ID"

# Testnet native XLM SAC — used as the escrow asset for demo purposes.
# Swap for a testnet USDC issuer's SAC id if you'd rather escrow stablecoins.
NATIVE_SAC_ID=$(stellar contract id asset --asset native --network "$NETWORK")
echo "==> Using native XLM SAC as escrow token: $NATIVE_SAC_ID"

ARBITRATOR_ADDRESS=$(stellar keys address "$ARBITRATOR")
ADMIN_ADDRESS=$(stellar keys address "$ADMIN")

echo "==> Initializing contract"
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$ADMIN" \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN_ADDRESS" \
  --arbitrator "$ARBITRATOR_ADDRESS" \
  --token "$NATIVE_SAC_ID"

echo "==> Writing contract-ids.json for the frontend"
mkdir -p "$ROOT_DIR/lib/contract"
cat > "$ROOT_DIR/lib/contract/contract-ids.json" <<EOF
{
  "testnet": {
    "contractId": "$CONTRACT_ID",
    "tokenId": "$NATIVE_SAC_ID",
    "arbitrator": "$ARBITRATOR_ADDRESS",
    "admin": "$ADMIN_ADDRESS",
    "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF

ENV_FILE="$ROOT_DIR/.env.local"
touch "$ENV_FILE"
if grep -q "^NEXT_PUBLIC_CONTRACT_ID=" "$ENV_FILE" 2>/dev/null; then
  sed -i.bak "s/^NEXT_PUBLIC_CONTRACT_ID=.*/NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID/" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
else
  echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
fi

echo ""
echo "==> Done. CONTRACT_ADDRESS_HERE -> $CONTRACT_ID"
echo "    Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
