# KDomino - Features & Améliorations possibles

> Généré le 2026-03-31 - Basé sur l'analyse complète du projet post-V2

---

## Nouvelles variantes de jeu

1. ~~**Queendomino**~~ - ✅ Implémenté. Mode `QueenDomino` complet avec 48 dominos dédiés (cases construction), 18 tuiles bâtiment, Builders Board, économie (pièces), chevaliers (taxe BFS), tours, la Reine (+1 couronne au meilleur territoire), le Dragon (destruction de bâtiments). Flow de tour étendu : placeDomino → placeKnight → constructBuilding → useDragon → pickDomino (actions optionnelles skippables). Scoring étendu : bonus bâtiments fin de partie (flat, perBuilding, perTower, perCrown, perTerrain), bonus Reine. Compatible extra rules (Middle Kingdom, Harmony, Mighty Duel, Dynasty). 4 nouvelles méthodes engine : `placeKnight`, `constructBuilding`, `useDragon`, `skipOptionalAction`.
2. **Age of Giants** - Extension avec tuiles géantes qui volent des couronnes et ajoutent des tuiles de 12 nouveaux dominos (numéros 49-60).
3. ~~**Mode solo**~~ - ✅ Implémenté. Support 1 joueur avec règles solo (48 dominos, 4 révélés par tour, 12 tours, grille 5×5). Le joueur choisit 1 domino sur 4 chaque tour. Compatible avec les extra rules (The middle Kingdom, Harmony, Dynasty) et toutes les stratégies bot.
4. **Mode "The Court"** - Variante officielle pour 2 joueurs avec un 3e royaume "fantôme".

## Règles et gameplay

5. ~~**Undo/Redo**~~ - ✅ Implémenté. `GameHistory` avec `createGameHistory`, `pushState`, `undo`, `redo`, `canUndo`, `canRedo`, `clearHistory`, `getHistorySize`. Snapshot-based, standalone utility.
6. ~~**Historique des coups**~~ - ✅ Implémenté. Log immuable via `wrapWithActionLog(engine)` qui enregistre chaque action. Queries : `getActions`, `getActionsByType`, `getActionsByTurn`. Replay complet via `replayActions(engine, log)`. Standalone utility, types exportés (`GameActionLog`, `ActionEntry`, `ActionType`).
7. **Mode spectateur** - API pour obtenir un état de jeu "censuré" (sans révéler les infos cachées aux autres joueurs).
8. **Timer/Horloge** - Support optionnel d'un timer par tour pour les parties compétitives.
9. ~~**Seed de partie**~~ - ✅ Implémenté. Seed optionnel dans `createGame({ seed })`, auto-généré si absent, déterminisme garanti sur dominos et lords.

## Qualité du moteur

10. ~~**Validation de state complète**~~ - ✅ Implémenté. Fonction `validateGameState(game)` qui vérifie l'intégrité complète de l'état : structure du Game, players (IDs uniques, noms, kingdoms 9×9, castle, terrains), dominos (numéros uniques, tiles valides, cohérence picked/lordId), lords (IDs uniques, playerId existant, flags cohérents), flow de jeu (nextAction/nextStep valides, lord existant), et rules (valeurs positives, extra rules valides). Retourne un `ValidationIssue[]` avec `path`, `code`, `message`, `severity`. Types exportés : `ValidationIssue`, `ValidationSeverity`.
11. ~~**Meilleurs messages d'erreur**~~ - ✅ Implémenté. Toutes les erreurs utilisent des `ErrorCode` structurés avec `context` (lordId, gameId, etc.). Messages traduits via `Translator` injectable dans `EngineConfig.translator`. Mapping `errorCodeToTranslationKey` + helper `translateErrorCode`. Support i18n complet avec `createTranslator({ customTranslations })`.
12. ~~**Mode debug**~~ - ✅ Implémenté. Wrapper standalone `wrapWithDebug(engine, options?)` qui intercepte chaque méthode du moteur et log des informations détaillées. 3 niveaux de verbosité : `minimal` (method + phase), `standard` (+ `GameStateSummary` + params clés), `verbose` (+ dump complet du state). Mesure la durée d'exécution. Logger custom injectable via `DebugLogger`. Intégré dans `EngineConfig.debug` (boolean ou `DebugOptions`). Types exportés : `DebugOptions`, `DebugLogger`, `DebugLogEntry`, `GameStateSummary`, `DebugLogLevel`.
13. ~~**Système d'événements (v2)**~~ - ✅ Implémenté. Callbacks optionnels via `EngineConfig.events` : `onGameCreated`, `onPlayersAdded`, `onGameStarted`, `onDominoPicked`, `onDominoPlaced`, `onDominoDiscarded`, `onTurnStart`, `onTurnEnd`, `onGameEnd`. Aussi disponible standalone via `wrapWithEvents(engine, callbacks)`.

## Nouveaux modes de jeu

14. **Kingdomino Duel** - Version dés du jeu (variante papier-crayon officielle).
15. **Kingdomino Origins** - Extension officielle avec feu, volcans et hommes des cavernes.
16. **Mode rapide** - Moins de tours, moins de dominos, pour des parties express.
17. **Mode draft** - Les joueurs voient tous les dominos du tour et draftent à tour de rôle (au lieu de la pioche standard).

## API & DX (Developer Experience)

18. **Suggestions IA** - Fonction `getBestPlacement(game)` qui retourne le placement optimal (scoring maximum). Utile pour un mode "hint" dans les UI ou un bot.
19. ~~**Bot / IA joueur**~~ - ✅ Implémenté. 4 stratégies : `randomStrategy`, `greedyStrategy`, `advancedStrategy` (lookahead 1 tour), `expertStrategy` (beam-search multi-tours). Helper `playBotTurn(engine, game, strategy)`.
28. ~~**Parties mixtes humains/bots**~~ - ✅ Implémenté. Champ optionnel `bot?: { strategyName: string }` sur `Player`. `PlayerInput = string | { name: string, bot? }` dans `addPlayers`. Registre de stratégies (`getStrategy`, `getStrategyNames`). Helpers `isBotTurn(game)` et `playBotTurns(engine, game, customStrategies?)` qui jouent tous les tours bot consécutifs. Supporte stratégies custom et sérialisation.
20. **Statistiques de partie** - Points par tour, courbe de progression, dominos défaussés, propriétés formées, etc.
21. **Export de partie** - Format standardisé (PGN-like) pour partager/importer des parties.
22. **WebSocket adapter** - Adaptateur réseau prêt à l'emploi pour le multijoueur en ligne.
23. **Plugin system** - Architecture de plugins pour que les consommateurs puissent ajouter des règles custom sans forker.

## Technique / Infra

24. ~~**Strict mode TypeScript**~~ - ✅ Implémenté. `strict: true` (inclut `strictNullChecks`) et `noUncheckedIndexedAccess: true` activés dans `tsconfig.json`. Toutes les erreurs de compilation corrigées.
25. **Benchmarks** - Suite de perf pour le scoring et le pathfinding (BFS), surtout pour les grilles 7×7/9×9.
26. ~~**WASM build**~~ - ✅ Implémenté. Build javy produisant `kingdomino-engine.wasm` depuis le bundle TypeScript. Protocole JSON RPC (stdin/stdout) pour appeler toutes les méthodes du moteur. Compatible wasmtime, wasmer, wazero. Exemples Python et shell. Bundle universel platform-neutral inclus (`dist/index.universal.js`).
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
- ~~**Strict mode TypeScript** (24)~~ - ✅ Done

---

## Roadmap ordonnée des features restantes

### Priorité haute — Fondations du moteur

1. ~~**Validation de state complète (10)**~~ — ✅ Done
2. **Mode spectateur (7)** — API censurée pour le multijoueur. Pré-requis avant tout adapter réseau (22). Complexité modérée.
3. ~~**Mode debug (12)**~~ — ✅ Done

### Priorité moyenne — Gameplay & variantes

4. ~~**Mode solo (3)**~~ — ✅ Done
5. ~~**Parties mixtes humains/bots (28)**~~ — ✅ Done
6. **Mode rapide (16)** — Moins de dominos/tours. Trivial à implémenter (paramétrage du nombre de dominos), valeur immédiate pour les UI.
6. **Timer/Horloge (8)** — Utile pour le compétitif. Standalone utility, pas de modification du moteur core.
7. **Mode draft (17)** — Variante intéressante mais modifie le flow de jeu. Plus complexe que les modes ci-dessus.

### Priorité basse — Extensions majeures

8. **Age of Giants (2)** — Extension officielle, nécessite de nouveaux dominos et mécaniques de géants. Effort significatif.
9. **Mode "The Court" (4)** — Variante 2 joueurs avec royaume fantôme. Mécanique nouvelle, public restreint.
10. ~~**Queendomino (1)**~~ — ✅ Done
11. **Kingdomino Origins (15)** — Extension avec feu/volcans. Complexité similaire à Queendomino.
12. **Kingdomino Duel (14)** — Version dés, papier-crayon. Gameplay totalement différent, partage peu de code.

### Priorité basse — API & Infra

13. **Statistiques de partie (20)** — Nice-to-have, exploitable via l'action log déjà implémenté.
14. **Export de partie (21)** — Format PGN-like, utile mais pas bloquant. L'action log couvre déjà le replay.
15. **Suggestions IA (18)** — `getBestPlacement()` — le bot `expertStrategy` fait déjà le gros du travail, c'est un wrapper.
16. **Plugin system (23)** — Architecture lourde, peu de demande tant que le moteur n'a pas plus d'adopteurs.
17. **WebSocket adapter (22)** — Dépend du mode spectateur (7). Réseau = complexité d'intégration élevée.
18. **Schéma JSON (27)** — Utile mais dérivable des types TypeScript existants.
19. **Benchmarks (25)** — Important pour l'optimisation mais pas bloquant fonctionnellement.
20. ~~**WASM build (26)**~~ — ✅ Done
