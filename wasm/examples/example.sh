#!/usr/bin/env bash
# KDomino WASM - Shell example
# Prerequisites: wasmtime, jq (optional, for pretty-printing)
# Build first: pnpm build:wasm

WASM="$(dirname "$0")/../../dist/kingdomino-engine.wasm"

echo "=== Get available modes ==="
echo '{"method":"getModes","params":{}}' | wasmtime "$WASM"

echo ""
echo "=== Create a Classic game ==="
GAME=$(echo '{"method":"createGame","params":{"mode":"Classic"}}' | wasmtime "$WASM")
echo "$GAME" | jq '.result.id, .result.dominoes | length'

echo ""
echo "=== Add players ==="
GAME_STATE=$(echo "$GAME" | jq -c '.result')
ADD_PLAYERS=$(echo "{\"method\":\"addPlayers\",\"params\":{\"game\":$GAME_STATE,\"players\":[\"Alice\",\"Bobby\"]}}" | wasmtime "$WASM")
echo "$ADD_PLAYERS" | jq '.result.players | length'
