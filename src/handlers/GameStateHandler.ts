import { Application, Texture } from "pixi.js"
import { ROOM_SIZE, RoomSprite } from "../sprites/RoomSprite"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors"
import { EnemyHandler } from "./EnemyHandler"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { ENEMY_TYPES } from "../const/enemyTypes"
import { BulletHandler } from "./BulletHandler"
import { SFX } from "../helpers/soundLoader"

export interface ILevelInputGenericEnemy {
    x?: number,
    y?: number,
    health?: number,
    baseSpeed?: number,
    standardPrice: number,
    hurtsPlayerOnCollision?: boolean,
    maxHealth?: number,
    behaviors?: TAnyBehaviorEntry[],
    hurtboxSize?: number,
    texture?: Texture
}

type EnemyWave = ILevelInputGenericEnemy[]

export interface ILevelData {
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

export const LEVEL_COUNT = 4

export const GameStateHandler = {
    globalLevels: [] as ILevelData[],
    currentLevelIdx: 0,
    currentVariationIdx: 0,
    currentWaveIdx: 0,
    boardEmptyForMs: 0,
    spawningNextWave: false,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _init(_app: Application) {
        if (GameStateHandler.globalLevels.length == 0) {
            GameStateHandler._createLevels()
        }

        EventHandler.on(GLOBAL_EVENTS.DOOR_ENTER, GameStateHandler._doorEnterHandler)
        EventHandler.on(GLOBAL_EVENTS.ENEMY_DIE, GameStateHandler._runWaveCheck)

        GameStateHandler._runWaveCheck()
    },

    _runWaveCheck() {
        /* if all dead */
        if (!GameStateHandler.areEnemiesAlive()) {
            /* if stage clear, setup doors */
            if (GameStateHandler.isLevelCleared()) {
                if (GameStateHandler.currentLevelIdx + 1 >= GameStateHandler.globalLevels.length) {
                    window.alert("all stages clear")
                }
                
                console.log("setting up doors")
                setTimeout(() => {
                    RoomSprite.updateDoorCount(GameStateHandler.globalLevels[GameStateHandler.currentLevelIdx + 1].variants.length)
                    SFX.play("doorOpen")
                }, 400);
                SFX.play("stageClear", { volume: 0.3, speed: Math.random() * 0.2 + 0.9 })
                
                EventHandler.emit(GLOBAL_EVENTS.STAGE_CLEAR)
                BulletHandler.bullets.forEach(b => b.life = b.maxLife)
            }
            /* if any waves left, run next wave */
            else {
                if (!GameStateHandler.spawningNextWave) {
                    GameStateHandler.currentWaveIdx++
                    GameStateHandler._runCurrentWaveSpawnSequence()
                }
            }
        }

        /* if enemies alive, do nothing */

        EventHandler.emit(GLOBAL_EVENTS.UPDATE_STAGE_INFO_UI)
    },

    _createLevels() {
        /* starting room */
        GameStateHandler.globalLevels.push({ variants: [{ enemyWaves: [] }] })

        /* tutorial room one choice */
        GameStateHandler.globalLevels.push({
            variants: [
                {
                    clearRewards: {
                        healthPickups: 5,
                        coinPickups: 10,
                        xp: 100
                    },
                    enemyWaves: [
                        [
                            (() => {
                                const shooter = ENEMY_TYPES.BASIC_SHOOTER()
                                return {
                                    ...shooter,
                                    x: ROOM_SIZE / 2,
                                    y: ROOM_SIZE / 2,
                                }
                            })()
                        ],
                        [
                            ...Array.from({ length: 3 }).map(() => (
                                ENEMY_TYPES.BASIC_SHOOTER()
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
                const enemyCreditsForStage = 300 + i * 125 + Math.random() * 200
                const currentLevelVariationData: ILevelVariantData = {
                    enemyWaves: []
                }
                if (!currentLevelVariationData.enemyWaves) currentLevelVariationData.enemyWaves = []

                /* get all enemies for entire level */
                const allEnemiesOnStage = [] as ILevelInputGenericEnemy[]
                let currentCredits = 0
                while (currentCredits < enemyCreditsForStage) {
                    /* if cant spawn any within credits, stop */
                    if (Object.values(ENEMY_TYPES).filter(e => e().standardPrice + currentCredits <= enemyCreditsForStage).length == 0) break

                    const chosenEnemy = Object.values(ENEMY_TYPES)[Math.floor(Math.random() * Object.keys(ENEMY_TYPES).length)]() as ILevelInputGenericEnemy

                    /* roll until enemy small enough found */
                    if (chosenEnemy.standardPrice + currentCredits > enemyCreditsForStage) continue

                    /* calc credits */
                    currentCredits += chosenEnemy.standardPrice
                    allEnemiesOnStage.push(chosenEnemy)
                }

                const finalCreditSum = allEnemiesOnStage.reduce((sum, e) => sum + e.standardPrice, 0)

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

            GameStateHandler.globalLevels.push({
                variants: currentLevelStageVariations
            })

            /* one level done */
        }
        /* run until all levels with variation combos done */

    },

    _doorEnterHandler(payload: { doorIdx: number }) {
        /* reset wave and doors */
        GameStateHandler.boardEmptyForMs = 0
        GameStateHandler.currentWaveIdx = 0
        GameStateHandler.currentLevelIdx += 1
        GameStateHandler.currentVariationIdx = payload.doorIdx
        EventHandler.emit(GLOBAL_EVENTS.UPDATE_STAGE_INFO_UI)
        GameStateHandler._runCurrentWaveSpawnSequence()
    },

    isLevelCleared() {
        const currentLevel = GameStateHandler.globalLevels[GameStateHandler.currentLevelIdx]
        const currentVariation = currentLevel.variants[GameStateHandler.currentVariationIdx] ?? { enemyWaves: [] }

        const areWavesDone = (
            currentVariation.enemyWaves == undefined ||
            currentVariation.enemyWaves.length == 0 ||
            GameStateHandler.currentWaveIdx >= currentVariation.enemyWaves.length
        )

        console.log("waves:", areWavesDone)

        return areWavesDone && !GameStateHandler.areEnemiesAlive()
    },

    areEnemiesAlive() {
        console.log("enemy count:", EnemyHandler.enemies.length)
        console.log("enemies waiting:", EnemyHandler.waitingToSpawn.length > 0)
        console.log("are enemies alive:", EnemyHandler.enemies.filter(e => !e.markedForDeletion).length > 0 || EnemyHandler.waitingToSpawn.length > 0)
        return EnemyHandler.enemies.filter(e => !e.markedForDeletion).length > 0 || EnemyHandler.waitingToSpawn.length > 0
    },

    _runCurrentWaveSpawnSequence() {
        /* if was last wave */
        if (GameStateHandler.isLevelCleared()) {
            GameStateHandler._runWaveCheck()
            console.log("stage clear")
            return;
        }

        GameStateHandler.spawningNextWave = true

        console.log("running current wave...")
        /* run current wave with small timeout */
        setTimeout(() => {
            const currentLevel = GameStateHandler.globalLevels[GameStateHandler.currentLevelIdx]
            const currentVariation = currentLevel.variants[GameStateHandler.currentVariationIdx] ?? { enemyWaves: [] }
            const currentEnemyWaves = currentVariation.enemyWaves ?? []

            if (currentEnemyWaves.length == 0) {
                console.log("no enemy waves, stage clear")
                GameStateHandler._runWaveCheck()
                return
            }

            console.log("enemy count:", currentEnemyWaves[GameStateHandler.currentWaveIdx].length)
            currentEnemyWaves[GameStateHandler.currentWaveIdx].forEach(enemy => {
                setTimeout(() => {
                    GameStateHandler.spawningNextWave = false

                    EnemyHandler.spawnEnemy(
                        enemy.x,
                        enemy.y,
                        enemy.health,
                        enemy.texture,
                        enemy.behaviors,
                        enemy.baseSpeed,
                        enemy.hurtsPlayerOnCollision,
                        enemy.maxHealth,
                        enemy.hurtboxSize,
                    )
                }, Math.random() * 400)
            })

            EventHandler.emit(GLOBAL_EVENTS.UPDATE_STAGE_INFO_UI)
        }, 600)
    },

    _update(/* ticker: Ticker */) {
        if (!GameStateHandler.globalLevels || GameStateHandler.globalLevels.length == 0) return;

        console.log(GameStateHandler.currentLevelIdx, GameStateHandler.currentWaveIdx)
    },
}