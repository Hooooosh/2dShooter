import * as PIXI from "pixi.js"
import { GenericEnemy, IGenericEnemy } from "../sprites/EnemySprite"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors"
import { DRAW_ORDERS } from "../const/drawOrders"
import { RoomSprite } from "../sprites/RoomSprite"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"

let enemyContainer: PIXI.Container | null = null

export const EnemyHandler = {
    enemies: [] as IGenericEnemy[],
    appRef: null as PIXI.Application | null,

    _init(app: PIXI.Application) {
        enemyContainer = new PIXI.Container()
        enemyContainer.zIndex = DRAW_ORDERS.ENEMIES

        app.stage.addChild(enemyContainer)
        app.ticker.add(this.update)

        this.appRef = app
    },

    spawnEnemy(x?: number, y?: number, health?: number, behaviors?: TAnyBehaviorEntry[], maxHealth?: number, hurtboxSize?: number, texture?: PIXI.Texture) {
        const enemy = new GenericEnemy(
            x ?? Math.random() * RoomSprite.ROOM_SIZE,
            y ?? Math.random() * RoomSprite.ROOM_SIZE,
            maxHealth,
            health = health ?? maxHealth,
            texture ?? PIXI.Assets.get("enemy-placeholder"),
            behaviors,
            hurtboxSize
        )

        if (EnemyHandler.appRef) {
            EnemyHandler.appRef.stage.addChild(enemy.sprite)
            EnemyHandler.enemies.push(enemy)
        }

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
            else{
                enemy._update(ticker)
            }
        }
    }
}
