import * as PIXI from "pixi.js"
import { GenericEnemy, IGenericEnemy } from "../sprites/EnemySprite"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors"
import { DRAW_ORDERS } from "../const/drawOrders"
import { RoomSprite } from "../sprites/RoomSprite"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { ParticleHandler } from "./ParticleHandler"
import getSpritePosClampedToBounds from "../helpers/getSpritePosClampedToBounds"

let enemyContainer: PIXI.Container | null = null

interface IWaitingToSpawnEnemy {
    enemy: IGenericEnemy,
    timeUntilSpawnMs: number
}

export const EnemyHandler = {
    enemies: [] as IGenericEnemy[],
    waitingToSpawn: [] as IWaitingToSpawnEnemy[],

    _init(app: PIXI.Application) {
        enemyContainer = new PIXI.Container()
        enemyContainer.zIndex = DRAW_ORDERS.ENEMIES

        app.stage.addChild(enemyContainer)
        app.ticker.add(this.update)
    },

    spawnEnemy(
        x?: number,
        y?: number,
        health?: number,
        texture?: PIXI.Texture,
        behaviors?: TAnyBehaviorEntry[],
        baseSpeed?: number,
        maxHealth?: number,
        hurtboxSize?: number,
    ) {
        const enemy = new GenericEnemy(
            x ?? Math.random() * RoomSprite.ROOM_SIZE,
            y ?? Math.random() * RoomSprite.ROOM_SIZE,
            health = health ?? maxHealth,
            texture ?? PIXI.Assets.get("enemy-placeholder"),
            behaviors = behaviors?.map((e) => ({ behavior: e.behavior, config: e.config ?? {} })),
            baseSpeed,
            maxHealth,
            hurtboxSize
        )
        const SPAWN_TIMER = Math.random() * 500 + 800
        
        const clamped = getSpritePosClampedToBounds({x: enemy.x, y: enemy.y}, enemy.sprite.width)
        enemy.x = clamped.x
        enemy.y = clamped.y
        
        ParticleHandler.spawnEnemySpawnIndicator(enemy.x, enemy.y, enemy.sprite.width + 20, SPAWN_TIMER)
        EnemyHandler.waitingToSpawn.push({ enemy, timeUntilSpawnMs: SPAWN_TIMER })

        return enemy
    },


    update(ticker: PIXI.Ticker) {
        for (const enemy of EnemyHandler.enemies) {
            /* remove deleted from scene */
            if (enemy.markedForDeletion) {
                EventHandler.emit(GLOBAL_EVENTS.ENEMY_DIE)
                EnemyHandler.enemies.splice(EnemyHandler.enemies.indexOf(enemy), 1)
                if (enemy.sprite && enemy.sprite.parent) {
                    enemy.sprite.parent.removeChild(enemy.sprite)
                }
            }
            else {
                enemy._update(ticker)
            }
        }

        EnemyHandler.waitingToSpawn.forEach(waiting => {
            waiting.timeUntilSpawnMs -= ticker.deltaMS

            if (waiting.timeUntilSpawnMs <= 0 && enemyContainer && waiting.enemy.sprite) {
                EnemyHandler.enemies.push(waiting.enemy)
                enemyContainer.addChild(waiting.enemy.sprite)
                EnemyHandler.waitingToSpawn.splice(EnemyHandler.waitingToSpawn.indexOf(waiting), 1)

                const renderPos = RoomSprite.getRenderPosition(waiting.enemy.x, waiting.enemy.y)
                waiting.enemy.sprite.x = renderPos.x
                waiting.enemy.sprite.y = renderPos.y
                ParticleHandler.spawnParticleExplosion(waiting.enemy.x, waiting.enemy.y)
            }
        })
    }
}
