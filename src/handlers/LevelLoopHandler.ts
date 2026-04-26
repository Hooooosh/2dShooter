import { Application, Texture } from "pixi.js"
import { ROOM_SIZE, RoomSprite } from "../sprites/RoomSprite"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors"
import { EnemyHandler } from "./EnemyHandler"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { ENEMY_TYPES } from "../const/enemyTypes"
import { BulletHandler } from "./BulletHandler"

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

export const LevelLoopHandler = {
    globalLevels: [] as ILevelData[],
    currentLevelIdx: 0,
    currentVariationIdx: 0,
    currentWaveIdx: 0,
    boardEmptyForMs: 0,
    spawningNextWave: false,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _init(_app: Application) {
        if (LevelLoopHandler.globalLevels.length == 0) {
            LevelLoopHandler._createLevels()
        }

        EventHandler.on(GLOBAL_EVENTS.DOOR_ENTER, LevelLoopHandler._doorEnterHandler)
        EventHandler.on(GLOBAL_EVENTS.ENEMY_DIE, LevelLoopHandler._runWaveCheck)

        LevelLoopHandler._runWaveCheck()
    },

    _runWaveCheck() {
        /* if all dead */
        if (!LevelLoopHandler.areEnemiesAlive()) {
            /* if stage clear, setup doors */
            if (LevelLoopHandler.isLevelCleared()) {
                if (LevelLoopHandler.currentLevelIdx + 1 >= LevelLoopHandler.globalLevels.length) {
                    window.alert("all stages clear")
                }
                
                console.log("setting up doors")
                RoomSprite.updateDoorCount(LevelLoopHandler.globalLevels[LevelLoopHandler.currentLevelIdx + 1].variants.length)
                EventHandler.emit(GLOBAL_EVENTS.STAGE_CLEAR)
                BulletHandler.bullets.forEach(b => b.markedForDeletion = true)
            }
            /* if any waves left, run next wave */
            else {
                if (!LevelLoopHandler.spawningNextWave) {
                    LevelLoopHandler.currentWaveIdx++
                    LevelLoopHandler._runCurrentWaveSpawnSequence()
                }
            }
        }

        /* if enemies alive, do nothing */

        EventHandler.emit(GLOBAL_EVENTS.UPDATE_STAGE_INFO_UI)
    },

    _createLevels() {
        /* starting room */
        LevelLoopHandler.globalLevels.push({ variants: [{ enemyWaves: [] }] })

        /* tutorial room one choice */
        LevelLoopHandler.globalLevels.push({
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

            LevelLoopHandler.globalLevels.push({
                variants: currentLevelStageVariations
            })

            /* one level done */
        }
        /* run until all levels with variation combos done */

    },

    _doorEnterHandler(payload: { doorIdx: number }) {
        /* reset wave and doors */
        LevelLoopHandler.boardEmptyForMs = 0
        LevelLoopHandler.currentWaveIdx = 0
        LevelLoopHandler.currentLevelIdx += 1
        LevelLoopHandler.currentVariationIdx = payload.doorIdx
        EventHandler.emit(GLOBAL_EVENTS.UPDATE_STAGE_INFO_UI)
        LevelLoopHandler._runCurrentWaveSpawnSequence()
    },

    isLevelCleared() {
        const currentLevel = LevelLoopHandler.globalLevels[LevelLoopHandler.currentLevelIdx]
        const currentVariation = currentLevel.variants[LevelLoopHandler.currentVariationIdx] ?? { enemyWaves: [] }

        const areWavesDone = (
            currentVariation.enemyWaves == undefined ||
            currentVariation.enemyWaves.length == 0 ||
            LevelLoopHandler.currentWaveIdx >= currentVariation.enemyWaves.length
        )

        console.log("waves:", areWavesDone)

        return areWavesDone && !LevelLoopHandler.areEnemiesAlive()
    },

    areEnemiesAlive() {
        console.log("enemy count:", EnemyHandler.enemies.length)
        console.log("enemies waiting:", EnemyHandler.waitingToSpawn.length > 0)
        console.log("are enemies alive:", EnemyHandler.enemies.filter(e => !e.markedForDeletion).length > 0 || EnemyHandler.waitingToSpawn.length > 0)
        return EnemyHandler.enemies.filter(e => !e.markedForDeletion).length > 0 || EnemyHandler.waitingToSpawn.length > 0
    },

    _runCurrentWaveSpawnSequence() {
        /* if was last wave */
        if (LevelLoopHandler.isLevelCleared()) {
            LevelLoopHandler._runWaveCheck()
            console.log("stage clear")
            return;
        }

        LevelLoopHandler.spawningNextWave = true

        console.log("running current wave...")
        /* run current wave with small timeout */
        setTimeout(() => {
            const currentLevel = LevelLoopHandler.globalLevels[LevelLoopHandler.currentLevelIdx]
            const currentVariation = currentLevel.variants[LevelLoopHandler.currentVariationIdx] ?? { enemyWaves: [] }
            const currentEnemyWaves = currentVariation.enemyWaves ?? []

            if (currentEnemyWaves.length == 0) {
                console.log("no enemy waves, stage clear")
                LevelLoopHandler._runWaveCheck()
                return
            }

            console.log("enemy count:", currentEnemyWaves[LevelLoopHandler.currentWaveIdx].length)
            currentEnemyWaves[LevelLoopHandler.currentWaveIdx].forEach(enemy => {
                setTimeout(() => {
                    LevelLoopHandler.spawningNextWave = false

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
        if (!LevelLoopHandler.globalLevels || LevelLoopHandler.globalLevels.length == 0) return;

        console.log(LevelLoopHandler.currentLevelIdx, LevelLoopHandler.currentWaveIdx)
    },
}