#!/usr/bin/env bash
# Creates (or reuses) local Stellar CLI identities for GigVault's testnet
# deployment: an admin/deployer, an arbitrator, and a demo client + freelancer.
set -euo pipefail

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

echo "==> Configuring the '$NETWORK' network alias"
stellar network add "$NETWORK" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  --overwrite || true

create_identity() {
  local name="$1"
  if stellar keys address "$name" >/dev/null 2>&1; then
    echo "==> Identity '$name' already exists: $(stellar keys address "$name")"
  else
    echo "==> Generating identity '$name'"
    stellar keys generate --global "$name" --network "$NETWORK" --fund
  fi
}

create_identity "gigvault-admin"
create_identity "gigvault-arbitrator"
create_identity "gigvault-client-demo"
create_identity "gigvault-freelancer-demo"

echo ""
echo "==> Addresses"
echo "admin:              $(stellar keys address gigvault-admin)"
echo "arbitrator:         $(stellar keys address gigvault-arbitrator)"
echo "client (demo):      $(stellar keys address gigvault-client-demo)"
echo "freelancer (demo):  $(stellar keys address gigvault-freelancer-demo)"
