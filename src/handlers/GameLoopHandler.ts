import { Application, Texture, Ticker } from "pixi.js"
import { RoomSprite } from "../sprites/RoomSprite"
import { ENEMY_BEHAVIORS, TAnyBehaviorEntry, TFollowPlayerConfig, TShootPeriodicallyConfig } from "../const/enemyBehaviors"
import { EnemyHandler } from "./EnemyHandler"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"

export interface ILevelInputGenericEnemy {
    x?: number,
    y?: number,
    health?: number,
    maxHealth?: number,
    behaviors?: TAnyBehaviorEntry[],
    hurtboxSize?: number,
    texture?: Texture
}

type EnemyWave = ILevelInputGenericEnemy[]

interface ILevelData {
    variants: ILevelVariantData[]
}

interface ILevelVariantData {
    enemyWaves?: EnemyWave[],
    clearRewards?: {
        healthPickups?: number,
        coinPickups?: number,
        xp?: number,
    }
}

export function getEnemyCreditsFromEnemy(enemy: ILevelInputGenericEnemy) {
    let sum = 0;

    sum += (enemy.health ?? 1) * 3

    if (enemy.behaviors) {
        const follow = enemy.behaviors.find(e => e.behavior === ENEMY_BEHAVIORS.followPlayerBehavior)
        const shoot = enemy.behaviors.find(e => e.behavior === ENEMY_BEHAVIORS.shootPeriodicallyBehavior)

        if (follow && (follow.config as TFollowPlayerConfig)) {
            sum += 10
            const conf = follow.config as TFollowPlayerConfig
            sum += conf.speed ? conf.speed * 10 : 0
            sum += conf.keepDistance ? conf.keepDistance / 100 : 0
        }

        if (shoot && shoot.config) {
            sum += 25
            const conf = shoot.config as TShootPeriodicallyConfig
            sum += conf.bulletSpeed ? conf.bulletSpeed * 5 : 0
            sum += conf.shootPeriod ? 2000 / conf.shootPeriod : 0
        }
    }
    return sum
}

export const LEVEL_COUNT = 4

export const GameLoopHandler = {
    globalLevels: [] as ILevelData[],
    currentLevelIdx: 0,
    currentVariationIdx: 0,
    currentWaveIdx: 0,
    boardEmptyForMs: 0,
    spawningNextWave: false,

    _init(app: Application) {
        if (GameLoopHandler.globalLevels.length == 0) {
            GameLoopHandler._createLevels()
        }

        EventHandler.on(GLOBAL_EVENTS.DOOR_ENTER, GameLoopHandler._runNextLevel)
        EventHandler.on(GLOBAL_EVENTS.ENEMY_DIE, GameLoopHandler._runNextWaveSpawnTimer)

        GameLoopHandler._runCurrentWave()
    },

    _createLevels() {
        /* starting room */
        GameLoopHandler.globalLevels.push({ variants: [] })

        /* tutorial room one choice */
        GameLoopHandler.globalLevels.push({
            variants: [
                {
                    clearRewards: {
                        healthPickups: 5,
                        coinPickups: 10,
                        xp: 100
                    },
                    enemyWaves: [
                        [
                            {
                                x: RoomSprite.ROOM_SIZE / 2,
                                y: RoomSprite.ROOM_SIZE / 2,
                                health: 5,
                                behaviors: [
                                    { behavior: ENEMY_BEHAVIORS.followPlayerBehavior },
                                    { behavior: ENEMY_BEHAVIORS.shootPeriodicallyBehavior }
                                ] as TAnyBehaviorEntry[]
                            }
                        ],
                        [
                            ...Array.from({ length: 3 }).map(() => (
                                {
                                    x: Math.random() * RoomSprite.ROOM_SIZE,
                                    y: Math.random() * RoomSprite.ROOM_SIZE,
                                    health: 3,
                                    behaviors: [
                                        { behavior: ENEMY_BEHAVIORS.followPlayerBehavior },
                                        { behavior: ENEMY_BEHAVIORS.shootPeriodicallyBehavior }
                                    ] as TAnyBehaviorEntry[]
                                }
                            ))
                        ]
                    ]
                }
            ]
        })

        /* ALL LEVELS */
        for (let i = 0; i < LEVEL_COUNT; i++) {
            let chosenLevelVariationCount = 2
            if (Math.random() < 0.4) chosenLevelVariationCount = 3
            if (Math.random() < 0.2) chosenLevelVariationCount = 4
            const currentLevelStageVariations: ILevelVariantData[] = []

            /* ONE LEVEL */
            for (let j = 0; j < chosenLevelVariationCount; j++) {
                /* generate one variation */
                const enemyCreditsForStage = 30 + i * 20 + Math.random() * 20
                const currentLevelVariationData: ILevelVariantData = {
                    enemyWaves: []
                }
                if (!currentLevelVariationData.enemyWaves) currentLevelVariationData.enemyWaves = []

                /* get all enemies for entire level */
                const allEnemiesOnStage = [] as ILevelInputGenericEnemy[]
                let currentCredits = 0
                while (currentCredits < enemyCreditsForStage) {
                    const enemy = {
                        health: Math.floor(Math.random() * 5) + 1,
                        behaviors: [] as TAnyBehaviorEntry[]
                    } as ILevelInputGenericEnemy

                    /* random behaviors */
                    if (Math.random() < 0.8) {
                        enemy.behaviors?.push({ behavior: ENEMY_BEHAVIORS.shootPeriodicallyBehavior } as TAnyBehaviorEntry)
                        if (Math.random() < 0.7) {
                            enemy.behaviors?.push({ behavior: ENEMY_BEHAVIORS.followPlayerBehavior } as TAnyBehaviorEntry)
                        }
                    }

                    /* calc credits */
                    currentCredits += getEnemyCreditsFromEnemy(enemy)
                    allEnemiesOnStage.push(enemy)
                }

                const finalCreditSum = allEnemiesOnStage.reduce((sum, e) => sum + getEnemyCreditsFromEnemy(e), 0)

                /* assign waves */
                let stageWaveCount;
                if (finalCreditSum < 50) stageWaveCount = 1
                else if (finalCreditSum < 80) stageWaveCount = 2
                else if (finalCreditSum < 120) stageWaveCount = 3
                else stageWaveCount = 4

                let insertingIntoWave = 0
                while (allEnemiesOnStage.length > 0) {
                    const enemy = allEnemiesOnStage.shift() as ILevelInputGenericEnemy
                    if (!currentLevelVariationData.enemyWaves[insertingIntoWave]) currentLevelVariationData.enemyWaves[insertingIntoWave] = []
                    currentLevelVariationData.enemyWaves[insertingIntoWave].push(enemy)
                    insertingIntoWave = (insertingIntoWave + 1) % stageWaveCount
                }

                /* calculate rewards */
                currentLevelVariationData.clearRewards = {
                    xp: finalCreditSum * 12,
                    coinPickups: Math.floor(finalCreditSum / 10),
                    healthPickups: finalCreditSum > 100 ? (Math.random() < 0.5 ? 2 : 1) : (Math.random() < 0.3 ? 1 : 0)
                }

                currentLevelStageVariations.push(currentLevelVariationData)
                /* one variation done */
            }

            GameLoopHandler.globalLevels.push({
                variants: currentLevelStageVariations
            })

            console.log(currentLevelStageVariations)

            /* one level done */
        }
        /* run until all levels with variation combos done */

    },

    _runNextLevel(payload: { doorIdx: number }) {
        /* reset wave and doors */
        GameLoopHandler.boardEmptyForMs = 0
        GameLoopHandler.currentWaveIdx = 0
        GameLoopHandler.currentLevelIdx += 1
        GameLoopHandler.currentVariationIdx = payload.doorIdx
        RoomSprite.displayedDoorCount = 0

        if (GameLoopHandler.currentLevelIdx + 1 >= GameLoopHandler.globalLevels.length) {
            console.log("all stages clear")
            return;
        }
        else {
            GameLoopHandler._runCurrentWaveSpawnTimer()
        }
    },

    _runNextWave() {
        GameLoopHandler.currentWaveIdx += 1
        GameLoopHandler._runCurrentWave()
    },

    _runCurrentWave() {
        const currentLevel = GameLoopHandler.globalLevels[GameLoopHandler.currentLevelIdx]
        const currentVariation = currentLevel.variants[GameLoopHandler.currentVariationIdx] ?? { enemyWaves: [] }
        console.log("running current wave")

        if (
            currentVariation.enemyWaves == undefined ||
            currentVariation.enemyWaves.length == 0 ||
            GameLoopHandler.currentWaveIdx >= currentVariation.enemyWaves.length
        ) {
            if (GameLoopHandler.currentLevelIdx + 1 >= GameLoopHandler.globalLevels.length) {
                console.log("all stages clear")
            }
            console.log("stage clear")

            RoomSprite.displayedDoorCount = GameLoopHandler.globalLevels[GameLoopHandler.currentLevelIdx + 1].variants.length
            EventHandler.emit(GLOBAL_EVENTS.STAGE_CLEAR)
            return;
        }

        const currentEnemyWaves = currentVariation.enemyWaves ?? []

        console.log("enemy count:", currentEnemyWaves[GameLoopHandler.currentWaveIdx].length)
        currentEnemyWaves[GameLoopHandler.currentWaveIdx].forEach(enemy => {
            EnemyHandler.spawnEnemy(
                enemy.x,
                enemy.y,
                enemy.health,
                enemy.behaviors,
                enemy.maxHealth,
                enemy.hurtboxSize,
                enemy.texture
            )
        })
    },

    _runCurrentWaveSpawnTimer() {
        if (EnemyHandler.enemies.filter(e => !e.markedForDeletion).length == 0 && !GameLoopHandler.spawningNextWave) {
            console.log("running current wave...")
            GameLoopHandler.spawningNextWave = true
            setTimeout(() => {
                GameLoopHandler._runCurrentWave()
                GameLoopHandler.spawningNextWave = false
            }, 1200)
        }
    },

    _runNextWaveSpawnTimer() {
        if (EnemyHandler.enemies.filter(e => !e.markedForDeletion).length == 0 && !GameLoopHandler.spawningNextWave) {
            console.log("running next wave...")
            GameLoopHandler.spawningNextWave = true
            setTimeout(() => {
                GameLoopHandler._runNextWave()
                GameLoopHandler.spawningNextWave = false
            }, 1200)
        }
    },

    _update(ticker: Ticker) {
        if (!GameLoopHandler.globalLevels || GameLoopHandler.globalLevels.length == 0) return;

        console.log(GameLoopHandler.currentLevelIdx, GameLoopHandler.currentWaveIdx)
    },
}