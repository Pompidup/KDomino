"""
KDomino WASM - Python example
Prerequisites: pip install wasmtime
Build first: pnpm build:wasm
"""

import json
import subprocess
import sys
from pathlib import Path

WASM_PATH = Path(__file__).parent.parent.parent / "dist" / "kingdomino-engine.wasm"


def call_engine(method: str, params: dict) -> dict:
    """Call a KDomino engine method via the WASM module."""
    request = json.dumps({"method": method, "params": params})
    result = subprocess.run(
        ["wasmtime", str(WASM_PATH)],
        input=request,
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def main():
    # Get available modes
    modes = call_engine("getModes", {})
    print("Available modes:", [m["name"] for m in modes["result"]])

    # Create a game
    game_response = call_engine("createGame", {"mode": "Classic"})
    game = game_response["result"]
    print(f"Game created: {game['id']} with {len(game['dominoes'])} dominoes")

    # Add players
    players_response = call_engine("addPlayers", {
        "game": game,
        "players": ["Alice", "Bobby"],
    })
    game = players_response["result"]
    print(f"Players: {[p['name'] for p in game['players']]}")

    # Start game
    start_response = call_engine("startGame", {"game": game})
    game = start_response["result"]
    print(f"Game started! Next action: {game['nextAction']}")


if __name__ == "__main__":
    main()
