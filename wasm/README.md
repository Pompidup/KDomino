# KDomino WASM Build

Use the Kingdomino engine from any language that supports WebAssembly (C#, Python, Rust, Go, etc.).

## Prerequisites

Install [javy](https://github.com/bytecodealliance/javy) (JS-to-WASM compiler):

Download the prebuilt binary from [GitHub releases](https://github.com/bytecodealliance/javy/releases):

```bash
# macOS ARM64 (Apple Silicon)
curl -L https://github.com/bytecodealliance/javy/releases/latest/download/javy-arm-macos-v8.1.0.gz -o javy.gz
gunzip javy.gz && chmod +x javy && sudo mv javy /usr/local/bin/javy

# macOS Intel
curl -L https://github.com/bytecodealliance/javy/releases/latest/download/javy-x86_64-macos-v8.1.0.gz -o javy.gz
gunzip javy.gz && chmod +x javy && sudo mv javy /usr/local/bin/javy

# Linux x86_64
curl -L https://github.com/bytecodealliance/javy/releases/latest/download/javy-x86_64-linux-v8.1.0.gz -o javy.gz
gunzip javy.gz && chmod +x javy && sudo mv javy /usr/local/bin/javy
```

Check the [releases page](https://github.com/bytecodealliance/javy/releases) for the latest version and all platforms.

Install a WASM runtime to run the module:

```bash
# wasmtime (recommended)
curl https://wasmtime.dev/install.sh -sSf | bash

# Or wasmer
curl https://get.wasmer.io -sSfL | sh
```

## Build

```bash
pnpm build:wasm
```

This produces `dist/kingdomino-engine.wasm`.

## Protocol

The WASM module uses a **JSON RPC protocol** over stdin/stdout.

**Request** (stdin):
```json
{ "method": "<engineMethod>", "params": <commandObject> }
```

**Success response** (stdout):
```json
{ "result": <returnValue> }
```

**Error response** (stdout):
```json
{ "error": { "code": "<errorCode>", "message": "<description>" } }
```

## Available methods

| Method | Params | Returns |
|--------|--------|---------|
| `getModes` | `{}` | `GameMode[]` |
| `getExtraRules` | `{ mode, players }` | `ExtraRule[]` |
| `createGame` | `{ mode, seed? }` | `GameWithNextStep` |
| `addPlayers` | `{ game, players }` | `GameWithNextStep` |
| `addExtraRules` | `{ game, rules }` | `GameWithNextStep` |
| `startGame` | `{ game }` | `GameWithNextAction` |
| `chooseDomino` | `{ game, lordId, dominoNumber }` | `GameWithNextAction` |
| `placeDomino` | `{ game, lordId, position, rotation }` | `GameState` |
| `discardDomino` | `{ game, lordId }` | `GameState` |
| `getResults` | `{ game }` | `GameWithResults` |
| `calculateScore` | `{ kingdom }` | `Score` |
| `getValidPlacements` | `{ kingdom, domino }` | `ValidPlacement[]` |
| `canPlaceDomino` | `{ kingdom, domino }` | `boolean` |
| `serialize` | `{ game }` | `string` |
| `deserialize` | `{ json }` | `GameState` |
| `getDynastyResults` | `{ games }` | `DynastyResult[]` |

## Usage examples

### Shell (wasmtime)

```bash
echo '{"method":"getModes","params":{}}' | wasmtime dist/kingdomino-engine.wasm
```

### Python

See [examples/example.py](examples/example.py)

### Any language

Any language with a WASM runtime (wasmtime, wasmer, wazero, etc.) can:
1. Load `kingdomino-engine.wasm`
2. Write JSON to stdin
3. Read JSON from stdout
4. Parse the response

The game state is stateless — pass the full game state in each request and receive the updated state in the response.
