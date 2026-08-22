#!/usr/bin/env bash
# Builds the GigVault Soroban contract to a wasm binary.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/contracts"

echo "==> Building gigvault contract (release, wasm32-unknown-unknown)"
stellar contract build

# stellar-cli >= 22 builds to wasm32v1-none; older versions used wasm32-unknown-unknown.
WASM_PATH="$ROOT_DIR/contracts/target/wasm32v1-none/release/gigvault.wasm"
if [ ! -f "$WASM_PATH" ]; then
  WASM_PATH="$ROOT_DIR/contracts/target/wasm32-unknown-unknown/release/gigvault.wasm"
fi
if [ ! -f "$WASM_PATH" ]; then
  echo "Build failed: wasm not found at $WASM_PATH"
  exit 1
fi

echo "==> Optimizing wasm"
stellar contract optimize --wasm "$WASM_PATH"

echo "==> Built: ${WASM_PATH%.wasm}.optimized.wasm"
