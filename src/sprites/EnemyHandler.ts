import * as PIXI from "pixi.js"
import { GenericEnemy, IGenericEnemy } from "./EnemySprite"
import { ENEMY_BEHAVIORS, TAnyBehaviorEntry, TFollowPlayerConfig, TShootPeriodicallyConfig } from "../const/enemyBehaviors"
import { RoomSprite } from "./RoomSprite"

let enemyContainer: PIXI.Container | null = null

export const EnemyHandler = {
    enemies: [] as IGenericEnemy[],
    appRef: null as PIXI.Application | null,

    _init(app: PIXI.Application) {
        enemyContainer = new PIXI.Container()

        app.stage.addChild(enemyContainer)
        app.ticker.add(this.update)

        this.appRef = app

        /* test */
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyE" && !e.repeat) {
                EnemyHandler.spawnEnemy(
                    Math.random() * RoomSprite.ROOM_SIZE,
                    Math.random() * RoomSprite.ROOM_SIZE,
                    3,
                    [
                        { behavior: ENEMY_BEHAVIORS.followPlayerBehavior, config: { speed: 2.5, keepDistance: 200 } as TFollowPlayerConfig },
                        { behavior: ENEMY_BEHAVIORS.shootPeriodicallyBehavior, config: { shootPeriod: 2500 } as TShootPeriodicallyConfig },
                    ] as TAnyBehaviorEntry[],
                )
            }
        })
    },

    spawnEnemy(x: number, y: number, health?: number, behaviors?: TAnyBehaviorEntry[], maxHealth?: number, hurtboxSize?: number, texture?: PIXI.Texture) {
        const enemy = new GenericEnemy(
            x,
            y,
            maxHealth,
            health = health ?? maxHealth ?? undefined,
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
                EnemyHandler.enemies.splice(EnemyHandler.enemies.indexOf(enemy), 1)
                if (enemy.sprite && enemy.sprite.parent) {
                    enemy.sprite.parent.removeChild(enemy.sprite)
                }
            }
            else{
                enemy.update(ticker)
            }
        }
    }
}
