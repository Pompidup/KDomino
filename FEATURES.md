# KDomino - Features & Améliorations possibles

> Généré le 2026-03-31 - Basé sur l'analyse complète du projet post-V2

---

## Nouvelles variantes de jeu

1. **Queendomino** - Extension officielle avec bâtiments, ressources (pièces), dragon, et la Reine qui donne des bonus. C'est la plus grosse extension possible.
2. **Age of Giants** - Extension avec tuiles géantes qui volent des couronnes et ajoutent des tuiles de 12 nouveaux dominos (numéros 49-60).
3. **Mode solo** - Un mode 1 joueur avec scoring cible (règles officielles : remplir le 5×5 avec le meilleur score possible).
4. **Mode "The Court"** - Variante officielle pour 2 joueurs avec un 3e royaume "fantôme".

## Règles et gameplay

5. ~~**Undo/Redo**~~ - ✅ Implémenté. `GameHistory` avec `createGameHistory`, `pushState`, `undo`, `redo`, `canUndo`, `canRedo`, `clearHistory`, `getHistorySize`. Snapshot-based, standalone utility.
6. ~~**Historique des coups**~~ - ✅ Implémenté. Log immuable via `wrapWithActionLog(engine)` qui enregistre chaque action. Queries : `getActions`, `getActionsByType`, `getActionsByTurn`. Replay complet via `replayActions(engine, log)`. Standalone utility, types exportés (`GameActionLog`, `ActionEntry`, `ActionType`).
7. **Mode spectateur** - API pour obtenir un état de jeu "censuré" (sans révéler les infos cachées aux autres joueurs).
8. **Timer/Horloge** - Support optionnel d'un timer par tour pour les parties compétitives.
9. ~~**Seed de partie**~~ - ✅ Implémenté. Seed optionnel dans `createGame({ seed })`, auto-généré si absent, déterminisme garanti sur dominos et lords.

## Qualité du moteur

10. **Validation de state complète** - Une fonction `validateGameState(game)` qui vérifie l'intégrité de l'état (pas de dominos dupliqués, kingdoms valides, etc.). Utile quand le consommateur persiste et restaure l'état.
11. ~~**Meilleurs messages d'erreur**~~ - ✅ Implémenté. Toutes les erreurs utilisent des `ErrorCode` structurés avec `context` (lordId, gameId, etc.). Messages traduits via `Translator` injectable dans `EngineConfig.translator`. Mapping `errorCodeToTranslationKey` + helper `translateErrorCode`. Support i18n complet avec `createTranslator({ customTranslations })`.
12. **Mode debug** - Logger plus détaillé avec dump de l'état à chaque étape, utile pour les consommateurs qui développent leur UI.
13. ~~**Système d'événements (v2)**~~ - ✅ Implémenté. Callbacks optionnels via `EngineConfig.events` : `onGameCreated`, `onPlayersAdded`, `onGameStarted`, `onDominoPicked`, `onDominoPlaced`, `onDominoDiscarded`, `onTurnStart`, `onTurnEnd`, `onGameEnd`. Aussi disponible standalone via `wrapWithEvents(engine, callbacks)`.

## Nouveaux modes de jeu

14. **Kingdomino Duel** - Version dés du jeu (variante papier-crayon officielle).
15. **Kingdomino Origins** - Extension officielle avec feu, volcans et hommes des cavernes.
16. **Mode rapide** - Moins de tours, moins de dominos, pour des parties express.
17. **Mode draft** - Les joueurs voient tous les dominos du tour et draftent à tour de rôle (au lieu de la pioche standard).

## API & DX (Developer Experience)

18. **Suggestions IA** - Fonction `getBestPlacement(game)` qui retourne le placement optimal (scoring maximum). Utile pour un mode "hint" dans les UI ou un bot.
19. ~~**Bot / IA joueur**~~ - ✅ Implémenté. 4 stratégies : `randomStrategy`, `greedyStrategy`, `advancedStrategy` (lookahead 1 tour), `expertStrategy` (beam-search multi-tours). Helper `playBotTurn(engine, game, strategy)`.
20. **Statistiques de partie** - Points par tour, courbe de progression, dominos défaussés, propriétés formées, etc.
21. **Export de partie** - Format standardisé (PGN-like) pour partager/importer des parties.
22. **WebSocket adapter** - Adaptateur réseau prêt à l'emploi pour le multijoueur en ligne.
23. **Plugin system** - Architecture de plugins pour que les consommateurs puissent ajouter des règles custom sans forker.

## Technique / Infra

24. **Strict mode TypeScript** - Activer `strictNullChecks` et `noUncheckedIndexedAccess` si pas déjà fait.
25. **Benchmarks** - Suite de perf pour le scoring et le pathfinding (BFS), surtout pour les grilles 7×7/9×9.
26. **WASM build** - Compiler le moteur en WASM pour l'utiliser hors écosystème Node (Unity, C#, etc.).
27. **Schéma JSON** - Publier un JSON Schema de l'état de jeu pour la validation côté consommateur.

---

## Priorités suggérées

Les plus impactantes à court terme :
- ~~**Seed de partie** (9)~~ - ✅ Done
- ~~**Undo/Redo** (5)~~ - ✅ Done
- ~~**Bot / IA joueur** (19)~~ - ✅ Done
- ~~**Système d'événements v2** (13)~~ - ✅ Done
- ~~**Historique des coups** (6)~~ - ✅ Done
- ~~**Meilleurs messages d'erreur** (11)~~ - ✅ Done
